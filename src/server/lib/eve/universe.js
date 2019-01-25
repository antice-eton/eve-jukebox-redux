const logger = require('../../utils.js').get_logger();
const knex = require('../../utils.js').get_orm();

const UniverseMethods = {

    async factions(query) {

        if (!query) {
            return knex.select('*').from('eve_factions');
        } else {
            return knex.select('*').from('eve_factions').where(
                'name', 'like', '%' + query
            );
        }
    },

    async faction(faction_id) {
        const faction = await knex('eve_factions').select('*').where({
            faction_id: faction_id
        });

        return faction[0];
    },

    async alliance(alliance_id) {
        const alliance = await this.request({
            url: '/alliances/' + alliance_id
        });

        return alliance;
    },

    async alliances(query) {
        if (!query) {
            const alliances = await this.request({
                url: '/alliances'
            });
            return alliances;
        } else {
            const alliances = await this.search(query, 'alliances');
        }

        return alliances;
    },

    async sovereignty(system_id) {

        console.log('Getting sov data for system:', system_id);

        const sov = await this.request({
            url: '/sovereignty/map'
        });

        if (!system_id) {
            return sov;
        } else {
            const systemSov = sov.filter((s) => s.system_id === system_id);
            return systemSov[0];
        }
    },

    async corporations(query) {
        const corporations = await this.search(query, 'corporations');

        return corporations;
    },

    async corporation(corporation_id) {
        const corporation = await this.request({
            url: '/corporations/' + corporation_id
        });

        return corporation;
    },

    async station(stationId) {

        const station = await knex.select('*').from('eve_stations').where({
            station_id: stationId
        });

        return station[0];
    },

    async stations(query) {
        if (!query) {
            const stations = await knex.select('*').from('eve_stations');
            return stations;
        } else {

            const where = {};

            console.log('QUERY:', query);

            const stations = await knex.select('*').from('eve_stations').where(function() {
                if (query.hasOwnProperty('system_id')) {
                    this.where('system_id', parseInt(query['system_id']));
                }

                if (typeof query === 'string') {
                    this.where('name', 'like', '%' + query);
                }
            }).orderBy('name');

            return stations;
        }
    },

    async constellation(constellationId) {
        const constellation = await knex.select('*').from('eve_constellations').where({
            constellation_id: constellationId
        });

        return constellation[0];
    },

    async system(systemId) {

        const system = await knex.select('*').from('eve_systems').where({
            system_id: systemId
        });

        return system[0];
    },

    async systems(query) {
        if (!query) {
            const systems = await knex.select('*').from('eve_systems').orderBy('name');
            return systems;
        } else {
            const systems = await knex.select('*').from('eve_systems').where(
                'name', 'like', query + '%'
            ).orderBy('name');
            return systems;
        }
    },

    async region(regionId) {
        const region = await knex.select('*').from('eve_regions').where({
            region_id: regionId
        });

        return region[0];
    },

    async regions(query) {
        let regions;

        if (query) {
            regions = await knex.select('*').from('eve_regions').where(
                'name', 'like', query + '%'
            ).orderBy('name');
        } else {
            regions = await knex.select('*').from('eve_regions').orderBy('name');
        }

        return regions;
    },

    async search(query, type) {
        return this.request({
            url: '/search',
            params: {
                categories: type,
                search: query,
                strict: false
            }
        });
    }
};

module.exports = UniverseMethods;
