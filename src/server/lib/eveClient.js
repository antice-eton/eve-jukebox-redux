const axios = require('axios');
const qs = require('qs');
const models = require('../models.js');

class EveClient {
    constructor(character, appConfig) {

        this.character = character;
        this.appConfig = appConfig;
    }

    async _req(options, stopRetry) {

        const newOptions = Object.assign({}, options);

        newOptions['url'] = this.appConfig['eve']['apiUrl'] + options['url'];

        if (!newOptions['headers']) {
            newOptions['headers'] = {}
        }

        newOptions['headers']['Authorization'] = 'Bearer ' + this.character.access_token;

        return axios(newOptions)
        .catch(async (err) => {
            if (err.response && err.response.status === 403) {
                if (stopRetry === true) {
                    throw err;
                }

                console.log('[ESC] EVE token has expired, try refreshing');

                return axios({
                    url: this.appConfig.eve.tokenUrl,
                    method: 'POST',
                    data: qs.stringify({ grant_type: 'refresh_token', refresh_token: this.character.refresh_token }),
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + Buffer.from(this.appConfig.eve.clientId + ':' + this.appConfig.eve.clientSecret).toString('base64')
                    }
                })
                .then(async (res) => {

                    console.log('[ESC] EVE tokens refreshed');

                    this.character.access_token = res.data.access_token;
                    await this.character.save();

                    console.log('[ESC] Retrying request');
                    return this._req(options, true);

                })
                console.log('[ESC] Error talking to eve');
                console.log(err.response);
            }
            throw err;
        });
    }

    async onlineStatus() {
        return this._req({
            url: '/characters/' + this.character.character_id + '/online/'
        });
    }

    async location() {
        return this._req({
            url: '/characters/' + this.character.character_id + '/location/'
        });
    }

    async createRegion(regionId) {
        console.log('[ESC] Creating region id: ', regionId);
        const res = await this._req({
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
        const res = await this._req({
            url: '/universe/constellations/' + constellationId + '/'
        });

        const cModel = await models.EveConstellation.create({
            constellation_id: res.data.constellation_id,
            name: res.data.name
        });

        var rModel = await models.EveRegion.findOne({
            where: {
                region_id: res.data.region_id
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
        const res = await this._req({
            url: '/universe/systems/' + systemId + '/'
        });

        const sModel = await models.EveSystem.create({
            system_id: res.data.system_id,
            name: res.data.name,
            star_id: res.data.star_id,
            security_status: Math.round(res.data.security_status * 100) / 100,
            security_class: res.data.security_class
        });

        var cModel = await models.EveConstellation.findOne({
            where: {
                constellation_id: res.data.constellation_id
            }
        });

        if (!cModel) {
            cModel = await this.createConstellation(res.data.constellation_id);
        }

        await cModel.addSystem(sModel);
        await sModel.setConstellation(cModel);

        return sModel;
    }

    async stationInfo(stationId) {
        var station = await models.EveStation.findOne({
            where: {
                station_id: stationId
            }
        });

        if (!station) {
            console.log('[ESC] Creating new station entry');

            const res = await this._req({
                url: '/universe/stations/' + stationId + '/'
            });

            station = await models.EveStation.create({
                station_id: res.data.station_id,
                name: res.data.name,
                type_id: res.data.type_id,
                owner: res.data.owner,
                race_id: res.data.race_id,
            });
        }

        return station;
    }

    async structureInfo(structureId) {
        var station = await models.EveStation.findOne({
            where: {
                structure_id: structureId
            }
        });

        if (!station) {
            console.log('[ESC] Creating new structure entry');

            const res = await this._req({
                url: '/universe/structures/' + structureId
            });

            station = await models.EveStructure.create({
                structure_id: res.data.structure_id,
                type_id: res.data.type_id,
                name: res.data.name,
                owner: res.data.owner_id
            });
        }

        return station;
    }

    async systemInfo(systemId) {

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

    async regionInfo(regionId) {

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

    async factionInfo(factionId) {
        var faction = await models.EveFaction.findOne({
            where: {
                faction_id: factionId
            }
        });

        if (!faction) {
            console.log('[ESC] Refreshing factions list');

            const res = await this._req({
                url: '/universe/factions'
            });

            await models.EveFaction.bulkCreate(res.data.map((faction) => {
                return {
                    corporation_id: faction.corporation_Id,
                    description: faction.description,
                    faction_id: faction.faction_id,
                    name: faction.name,
                    militia_corporation_id: faction.militia_corporation_id
                };
            }));

            faction = await models.EveFaction.findOne({
                where: {
                    faction_id: factionId
                }
            });
        }

        return faction;
    }

    async corporationInfo(corporationId) {
        var corporation = await models.EveCorporation.findOne({
            corporation_id: corporationId
        });

        if  (!corporation) {
            console.log('[ESC] Creating new corporation');

            const res = await this._req({
                url: '/corporations/' + corporationId + '/'
            });

            corporation = models.EveCorporation.create({
                corporation_id: res.data.corporation_id,
                ceo_id: res.data.ceo_id,
                creator_id: res.data.creator_id,
                date_founded: new Date(res.data.date_founded),
                name: res.data.name,
                ticker: res.data.ticker
            });
        }

        return corporation;
    }

    async sovInfo(systemId) {
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
            console.log('[ESC] Refreshing sovereignty data');
            await models.EveSovereignty.destroy({
                truncate: true
            });

            var sovRes = await this._req({
                url:  '/sovereignty/map/'
            });

            await models.EveSovereignty.bulkCreate(sovRes.data.map((sovRecord) => {
                return {
                    system_id: sovRecord.system_id,
                    corporation_id: sovRecord.corporation_id,
                    faction_id: sovRecord.faction_id,
                    alliance_id: sovRecord.alliance_id
                }
            }));

            sov = await models.EveSovereignty.findOne({
                where: {
                    system_id: system.system_id
                }
            });
        }

        return sov;
    }
}

module.exports = EveClient;
