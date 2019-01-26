const getSessionData = require('./sessionState.js').get_state;
const get_logger = require('../../utils.js').get_logger;
const get_orm = require('../../utils.js').get_orm;
const EveClient = require('../eve/client.js');
const appConfig = require('../../config.js');
const _ = require('lodash');

const logger = get_logger();

async function tick(client) {

    const online = await report_online_status(client);

    if (online === false) {
        return;
    }

    const location = await report_location(client);

    if (!location) {
        return;
    }

    const playlist = await target_playlist(location, client);

    if (playlist) {
        console.log('playlist:', playlist);
        client.ws.send(JSON.stringify({
            message: 'playlist',
            data: playlist
        }));
    }

    await report_online_status(client);
}

async function target_playlist(location, client) {
    const eve = client.eve;

    const knex = get_orm();

    const playlist_rule_ids = await knex.select('playlist_rule_id').from('playlist_rules_to_characters')
    .where({
        character_id: client.character.character_id
    });

    const playlists = await knex.select('*')
    .from('playlist_rules')
    .whereIn('id', playlist_rule_ids.map((row) => row.playlist_rule_id))
    .orderBy('priority', 'asc');

    for (let i = 0; i < playlists.length; i++) {
        const playlist_rule = playlists[i];
        if (typeof playlist_rule.criteria === 'string') {
            playlist_rule.criteria = JSON.parse(playlist_rule.criteria);
        }

        const criteria = playlist_rule.criteria;

        for (let j = 0; j < criteria.length; j++) {
            const c = criteria[j];

            if (c.type === 'region') {
                if (location.region && location.region.region_id === c.criteria.region_id) {
                    return playlists[i];
                }
            } else if (c.type === 'system') {
                if (location.system && location.system.system_id === c.criteria.system_id) {
                    return playlists[i];
                }
            } else if (c.type === 'station') {
                if (location.station && location.station.station_id === c.criteria.station_id) {
                    return playlists[i];
                }
            } else if (c.type === 'system_security') {

                const security = Math.round(location.system.security_status * 10) / 10;

                console.log('Checking security:', security, ' - against:', c.criteria);


                if (security >= 0.5 && c.criteria === 'high-sec') {
                    return playlists[i];
                } else if (security < 0.5 && security >= 0.1 && c.criteria === 'low-sec') {
                    return playlists[i];
                } else if (security <= 0.0 && security >= -1.0 && c.criteria === 'null-sec') {
                    return playlists[i];
                } else if (security == c.criteria) {
                    return playlists[i];
                }
            }
        }
    }
}

async function report_location(client) {
    const eve = client.eve;

    const locationData = await eve.location(client.character.character_id);

    if (JSON.stringify(locationData) === JSON.stringify(client.cache['location'])) {
        return null; // no need to broadcast the same thing
    }

    const location = {};

    if (locationData['solar_system_id']) {
        const system = await eve.system(locationData['solar_system_id']);
        const constellation = await eve.constellation(system.constellation_id);
        const region = await eve.region(constellation.region_id);
        location['system'] = system;
        location['region'] = region;
    }

    if (locationData['station_id']) {
        location['docked'] = true;
        location['station'] = await eve.station(locationData['station_id']);
    }

    if (locationData['structure_id']) {
        location['docked'] = true;
    }

    const sov = await eve.sovereignty(locationData['solar_system_id']);
    location['sov'] = {};
    if (sov['faction_id']) {
        location['sov']['faction'] = await eve.faction(sov['faction_id']);
    }

    if (sov['corporation_id']) {
        location['sov']['corporation'] = await eve.corporation(sov['corporation_id']);
    }

    if (sov['alliance_id']) {
        location['sov']['alliance'] = await eve.alliance(sov['alliance_id']);
    }

    client.ws.send(JSON.stringify({
        message: 'location',
        data: location
    }));

    client.cache['location'] = locationData;

    return location;
}

async function report_online_status(client) {
    const eve = client.eve;

    const onlineData = await eve.online(client.character.character_id);

    if (onlineData.online !== client.cache.online) {
        client.ws.send(JSON.stringify({
            message: 'online',
            data: {
                online: onlineData.online
            }
        }));
        client.cache.online = onlineData.online;

        return onlineData.online;
    }

    return null;
}

module.exports = {
    report_location,
    report_online_status,
    tick
};
