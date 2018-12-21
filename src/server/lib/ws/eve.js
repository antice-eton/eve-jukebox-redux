const getSessionData = require('./sessionState.js').get_state;
const get_logger = require('../../utils.js').get_logger;
const EveStatusClient = require('../eve/status.js');
const EveUniverseClient = require('../eve/universe.js');
const appConfig = require('../../config.js');
const _ = require('lodash');

const logger = get_logger();

async function active_character(sessionId) {

    const state = getSessionData(sessionId);

    if (state.new_character === true) {
        return;
    }

    state.new_character = true

    const ws = state.ws_client;

    if (!state.active_character_id) {
        if (state.user.active_character_id) {
            state.active_character_id = state.user.active_character_id;
        }  else {
            logger.warn('No active character id');
            return false;
        }
    }

    if (!state.active_character || state.active_character_id !== state.active_character.character_id) {
        logger.debug('Getting new character instance setup for session:' + sessionId);

        const user = state.user;
        const character = await user.getCharacters({
            where: {
                character_id: state.active_character_id
            }
        });

        if (!character[0]) {
            throw "What the server thinks is the active character id for this session is not aligned with what is in the database";
        }
        state.active_character = character[0];
        state.status_client = new EveStatusClient(state.active_character, appConfig['eve']);
        state.universe_client = new EveUniverseClient(state.active_character, appConfig['eve']);

        state.cached_data['online'] = null;
        state.cached_data['location'] = null;
        state.previous_tick_data['online'] = null;
        state.previous_tick_data['location'] = null;

        ws.send(JSON.stringify({
            message: 'ACTIVE_CHARACTER',
            data: character[0]
        }));
    }
    state.new_character = false;
    return state.active_character;
}

async function get_status_data(sessionId, methodName) {

    const state = getSessionData(sessionId);
    const statusClient = state.status_client;

    if (state.cached_data[methodName]) {
        if (Date.now() > (state.cached_data[methodName].expires + 2000)) {
            const res = await statusClient[methodName]();
            const expiresDate = new Date(res.headers['expires']);

            state.cached_data[methodName] = {
                data: res.data,
                expires: expiresDate.getTime()
            };
        }
    } else {
        const res = await statusClient[methodName]();
        const expiresDate = new Date(res.headers['expires']);
        state.cached_data[methodName] = {
            data: res.data,
            expires: expiresDate.getTime()
        };
    }

    return state.cached_data[methodName].data;
}

async function report_location(sessionId) {
    const character = await active_character(sessionId);
    if (!character) { return; }

    const state = getSessionData(sessionId);
    const ws = state.ws_client;
    const universeClient = state.universe_client;
    const statusClient = state.status_client;

    const locationData = await get_status_data(sessionId, 'location');

    if (JSON.stringify(locationData) !== JSON.stringify(state.previous_tick_data['location'])) {

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

        state.previous_tick_data['location'] = locationData;
    }
}

async function report_online_status(sessionId) {
    const character = await active_character(sessionId);
    if (!character) { return; }
    
    const state = getSessionData(sessionId);
    const ws = state.ws_client;
    const statusClient = state.status_client;

    const onlineData = await get_status_data(sessionId, 'online');

    if (onlineData.online !== _.get(state.previous_tick_data, 'online.online')) {
        ws.send(JSON.stringify({
            message: 'online',
            data: {
                online: onlineData.online
            }
        }));
        state.previous_tick_data['online'] = onlineData;
    }
}

module.exports = {
    report_location,
    report_online_status
};
