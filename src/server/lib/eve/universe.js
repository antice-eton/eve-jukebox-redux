const models = require('../../models.js');

const logger = require('../../utils.js').get_logger();

const EJR_AGENT_NAME = 'EVE Jukebox Redux v1.0.0-ALPHA';

const EveClient = require('./client.js');

class EveUniverseClient extends EveClient {
    constructor(character, appConfig) {
        super(character, appConfig);
    }

    async refreshFactions() {
        logger.info('Refreshing EVE factions data');
        const res = await this.request({
            url: '/universe/factions'
        });

        await models.EveFaction.destroy({
            where: {},
            truncate: false
        });

        await models.EveFaction.bulkCreate(res.map((faction) => {
            return {
                corporation_id: faction.corporation_Id,
                description: faction.description,
                faction_id: faction.faction_id,
                name: faction.name,
                militia_corporation_id: faction.militia_corporation_id
            };
        }));
    }

    async refreshSovereignty() {
        logger.info('Refreshing EVE Sovereignty data');
        await models.EveSovereignty.destroy({
            truncate: true
        });

        var sovRes = await this.request({
            url:  '/sovereignty/map/'
        });

        await models.EveSovereignty.bulkCreate(sovRes.map((sovRecord) => {
            return {
                system_id: sovRecord.system_id,
                corporation_id: sovRecord.corporation_id,
                faction_id: sovRecord.faction_id,
                alliance_id: sovRecord.alliance_id
            }
        }));
    }

    async createRegion(regionId) {
        console.log('[ESC] Creating region id: ', regionId);
        const res = await this.request({
            url: '/universe/regions/' + regionId + '/'
        });

        return models.EveRegion.create({
            region_id: res.data.region_id,
            name: res.data.name,
            description: res.data.description
        });
    }

    async createConstellation(constellationId) {
        console.log('[ESC] Creating constellation id: ', constellationId);
        const res = await this.request({
            url: '/universe/constellations/' + constellationId + '/'
        });

        const cModel = await models.EveConstellation.create({
            constellation_id: res.constellation_id,
            name: res.name
        });

        var rModel = await models.EveRegion.findOne({
            where: {
                region_id: res.region_id
            }
        });

        if (!rModel) {
            rModel = await this.createRegion(res.data.region_id);
        }

        await rModel.addConstellation(cModel);
        await cModel.setRegion(rModel);

        return cModel;
    }

    async createSystem(systemId) {
        console.log('[ESC] Creating system id:', systemId);
        const res = await this.request({
            url: '/universe/systems/' + systemId + '/'
        });

        const sModel = await models.EveSystem.create({
            system_id: res.system_id,
            name: res.name,
            star_id: res.star_id,
            security_status: Math.round(res.security_status * 100) / 100,
            security_class: res.security_class
        });

        var cModel = await models.EveConstellation.findOne({
            where: {
                constellation_id: res.constellation_id
            }
        });

        if (!cModel) {
            cModel = await this.createConstellation(res.constellation_id);
        }

        await cModel.addSystem(sModel);
        await sModel.setConstellation(cModel);

        return sModel;
    }

    async createStation(stationId) {
        const res = await this.request({
            url: '/universe/stations/' + stationId + '/'
        });

        await models.EveStation.destroy({
            where: {
                station_id: res.station_id
            }
        });

        station = await models.EveStation.create({
            station_id: res.station_id,
            name: res.name,
            type_id: res.type_id,
            owner: res.owner,
            race_id: res.race_id,
        });

        return station;
    }

    async createCorporation(corporationId) {
        console.log('[ESC] Creating new corporation');

        const res = await this.request({
            url: '/corporations/' + corporationId + '/'
        });

        const corporation = await models.EveCorporation.create({
            corporation_id: corporationId,
            alliance_id: res.alliance_id,
            ceo_id: res.ceo_id,
            creator_id: res.creator_id,
            date_founded: new Date(res.date_founded),
            name: res.name,
            ticker: res.ticker
        });

        return corporation;

    }

    async createAlliance(allianceId) {
        const res = await this.request({
            url: '/alliances/' + allianceId + '/'
        });

        const alliance = await models.EveAlliance.create({
            alliance_id: allianceId,
            date_founded: new Date(res.date_founded),
            name: res.name,
            ticker: res.ticker,
            faction_id: res.faction_id
        });

        return alliance
    }

    async alliance(allianceId) {
        var alliance = await models.EveAlliance.findOne({
            where: {
                alliance_id: allianceId
            }
        });

        if (!alliance) {
            alliance = await this.createAlliance(allianceId);
        }

        return alliance;
    }

    async station(stationId) {
        var station = await models.EveStation.findOne({
            where: {
                station_id: stationId
            }
        });

        if (!station) {
            station = await this.createStation(stationId);
        }

        return station;
    }

    async system(systemId) {

        var system = await models.EveSystem.findOne({
            where: {
                system_id: systemId
            }
        });

        if (!system) {
            system = await this.createSystem(systemId);
        }

        var constellation = await system.getConstellation();
        var region = await constellation.getRegion();


        return {
            system,
            region
        }
    }

    async region(regionId) {

        var region = await models.EveRegion.findOne({
            where: {
                region_id: regionId
            }
        });

        if (!region) {
            region = await this.createRegion(regionId);
        }

        return region;
    }

    async faction(factionId) {
        var faction = await models.EveFaction.findOne({
            where: {
                faction_id: factionId
            }
        });

        if (!faction) {
            this.refreshFactions();
            faction = await models.EveFaction.findOne({
                where: {
                    faction_id: factionId
                }
            });
        }

        return faction;
    }

    async corporation(corporationId) {
        var corporation = await models.EveCorporation.findOne({
            corporation_id: corporationId
        });

        if  (!corporation) {
            corporation = await this.createCorporation(corporationId);
        }

        return corporation;
    }

    async sovereignty(systemId) {
        var system = await models.EveSystem.findOne({
            where: {
                system_id: systemId
            }
        });

        if (!system) {
            system = await this.createSystem();
        }

        var refresh_sov = false;

        var sov = await models.EveSovereignty.findOne({
            where: {
                system_id: system.system_id
            }
        });
        if (!sov) {
            refresh_sov = true;
        } else if (Date.now() > (sov.createdAt.getTime() + 3600000)) {
            refresh_sov = true;
        }

        if (refresh_sov) {
            await this.refreshSovereignty();

            sov = await models.EveSovereignty.findOne({
                where: {
                    system_id: system.system_id
                }
            });
        }

        return sov;
    }

};

module.exports = EveUniverseClient;
