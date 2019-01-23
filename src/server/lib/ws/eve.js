const getSessionData = require('./sessionState.js').get_state;
const get_logger = require('../../utils.js').get_logger;
const EveClient = require('../eve/client.js');
const appConfig = require('../../config.js');
const _ = require('lodash');

const logger = get_logger();

async function tick(client) {

    await report_location(client);
    await report_online_status(client);
}

async function report_location(client) {
    const eve = client.eve;

    const locationData = await eve.location(client.character.character_id);

    if (JSON.stringify(locationData) === JSON.stringify(client.cache['location'])) {
        return; // no need to broadcast the same thing
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

    console.log('Fetch sov data for solar system:', locationData['solar_system_id']);
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

    logger.debug('Sending message:');
    logger.debug(location);
    client.ws.send(JSON.stringify({
        message: 'location',
        data: location
    }));

    client.cache['location'] = locationData;
}

async function report_online_status(client) {
    const eve = client.eve;

    const onlineData = await eve.online(client.character.character_id);

    if (onlineData.online !== client.cache.online) {
        logger.debug('Sending message:');
        logger.debug({online: onlineData. online});
        client.ws.send(JSON.stringify({
            message: 'online',
            data: {
                online: onlineData.online
            }
        }));
        client.cache.online = onlineData.online;
    }
}

module.exports = {
    report_location,
    report_online_status,
    tick
};
