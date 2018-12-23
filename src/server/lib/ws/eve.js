const getSessionData = require('./sessionState.js').get_state;
const get_logger = require('../../utils.js').get_logger;
const EveStatusClient = require('../eve/status.js');
const EveUniverseClient = require('../eve/universe.js');
const appConfig = require('../../config.js');
const _ = require('lodash');

const logger = get_logger();

async function refresh_active_character(sessionId) {
    const state = getSessionData(sessionId);
    const ws = state.ws_client;

    const characters = await state.user.getCharacters({
        where: {
            character_id: state.user.active_character_id
        }
    });

    if (!characters[0]) {
        state.refresh_user = true;
        return;
    }

    state.active_character = characters[0];

    state.active_character_id = state.active_character.character_id;
    state.status_client = new EveStatusClient(state.active_character, appConfig['eve']);
    state.universe_client = new EveUniverseClient(state.active_character, appConfig['eve']);
    state.refresh_active_character = false;

    state.previous_tick_data['eve'] = {};
    state.cached_data['eve'] = {};

    ws.send(JSON.stringify({
        message: 'active-character',
        data: {
            character_id: state.active_character.character_id,
            character_name: state.active_character.character_name
        }
    }));
}

async function tick(sessionId) {
    const state = getSessionData(sessionId);
    const ws = state.ws_client;

    // Check to see if active character in user is not the same as in session
    if (state.user.active_character_id !== state.active_character_id) {
        state.refresh_active_character = true;
    }

    if (state.refresh_active_character) {
        logger.debug('Reloading active character');
        await refresh_active_character(sessionId);
    }

    await report_location(sessionId);
    await report_online_status(sessionId);
}

async function report_location(sessionId) {
    const state = getSessionData(sessionId);
    const statusClient = state.status_client;
    const universeClient = state.universe_client;
    if (!universeClient || !statusClient) {
        logger.warn('Requesting EVE location but no clients are setup yet');
        return;
    }

    const ws = state.ws_client;
    const locationData = await statusClient.location();

    if (JSON.stringify(locationData) !== JSON.stringify(state.previous_tick_data['eve']['location'])) {

        const location = {};

        if (locationData['solar_system_id']) {
            const uniData = await universeClient.system(locationData['solar_system_id']);
            location['system'] = uniData.system;
            location['region'] = uniData.region;
        }

        if (locationData['station_id']) {
            location['docked'] = true;
            location['station'] = await universeClient.station(locationData['station_id']);
        }

        if (locationData['structure_id']) {
            location['docked'] = true;
        }

        const sov = await universeClient.sovereignty(locationData['solar_system_id']);
        location['sov'] = {};

        if (sov['faction_id']) {
            location['sov']['faction'] = await universeClient.faction(sov['faction_id']);
        }

        if (sov['corporation_id']) {
            location['sov']['corporation'] = await universeClient.corporation(sov['corporation_id']);
        }

        if (sov['alliance_id']) {
            location['sov']['alliance'] = await universeClient.alliance(sov['alliance_id']);
        }

        logger.debug('[WS] New location data!');

        ws.send(JSON.stringify({
            message: 'location',
            data: location
        }));

        state.previous_tick_data['eve']['location'] = locationData;
    }
}

async function report_online_status(sessionId) {
    const state = getSessionData(sessionId);
    const ws = state.ws_client;
    const statusClient = state.status_client;

    if (!statusClient) {
        logger.warn('Tried to get EVE character online status but no status client was available');
        return;
    }

    const onlineData = await statusClient.online();

    if (onlineData.online !== _.get(state.previous_tick_data, 'eve.online.online')) {
        ws.send(JSON.stringify({
            message: 'online',
            data: {
                online: onlineData.online
            }
        }));
        state.previous_tick_data['eve']['online'] = onlineData;
    }
}

module.exports = {
    report_location,
    report_online_status,
    tick
};
