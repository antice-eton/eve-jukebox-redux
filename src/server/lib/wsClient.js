const models = require('../models.js');
const EveStatusClient = require('./eve/status.js');
const EveUniverseClient = require('./eve/universe.js');
const appConfig = require('../config.js');
const logger = require('../utils.js').get_logger();
const _ = require('lodash');

const msPlugins = require('../../plugins/music_sources/ejr-plugins-api.js');
const serverState = require('./serverState.js');
//const express = require('express');
//const parseCookie = express.cookieParser();


// messages
/*

message: {
  type: 'online' | 'location',
  data: {}
}

online: true | false

location: {
  region: {},
  system: {},
  station: {},
  docked: true | false
}

*/


const sessionData = {
    timers: {},
    characters: {},
    ws_clients: {},
    status_clients: {},
    universe_clients: {},
    ticking: {},
    cached_data: {},
    previous_tick_data: {},
    session_users: {},
    music_source: {},
    active_musicsource_id: {},
    active_character_id: {},
    active_characters: {}
};

function disconnect(sessionId) {
    logger.info('[WS] Disconnecting session: ' + sessionId);
    clearInterval(sessionTimers[sessionId]);

    Object.keys(sessionData).forEach((key) => {
        delete(sessionData[key][sessionId]);
    });
}

async function session_user(sessionId) {
    if (!sessionData.session_users[sessionId]) {
        let user = await models.User.findOne({where: { session_id: sessionId }});

        if (!user) {
            throw "Session ID not found";
        }

        sessionData.session_users[sessionId] = user;
    }

    const user = sessionData.session_users[sessionId];

    return user;
}

async function active_character(sessionId) {
    const state = serverState(sessionId);

    if (!state.active_character_id) {
        return false;
    }

    if (state.active_character_id !== sessionData.active_character_id[sessionId]) {
        const user = await session_user(sessionId);
        const character = await user.getCharacters({
            where: {
                character_id: state.active_character_id
            }
        });

        if (!character[0]) {
            throw "What the server thinks is the active character id for this session is not aligned with what is in the database";
        }
        sessionData.active_characters[sessionId] = character[0];

        if (!sessionData.status_clients[sessionId]) {
            sessionData.status_clients[sessionId] = new EveStatusClient(character[0], appConfig['eve']);
        } else {
            sessionData.status_clients[sessionId].character = character[0];
        }

        if (!sessionData.universe_clients[sessionId]) {
            sessionData.universe_clients[sessionId] = new EveUniverseClient(character[0], appConfig['eve']);
        } else {
            sessionData.universe_clients[sessionId].character = character[0];
        }

        const ws = sessionData.ws_clients[sessionId];
        ws.send(JSON.stringify({
            message: 'ACTIVE_CHARACTER',
            data: character[0]
        }));
    }

    return sessionData.active_characters[sessionId];
}

async function musicsource_active(sessionId) {
    try {
        if (!sessionData.session_users[sessionId]) {
            let user = await models.User.findOne({where: { session_id: sessionId }});

            if (!user) {
                return false;
            }

            sessionData.session_users[sessionId] = user;
        }

        const user = sessionData.session_users[sessionId];
        await user.reload();

        if (!user.active_musicsource_id) {
            return false;
        }

        return true;
    } catch (err) {
        logger.error('[WS] Error checking active music source:');
        console.error(err);
    }
}

async function startSubscription(sessionId) {
    try {
        const ws = sessionData.ws_clients[sessionId];
        const user = await models.User.findOne({where: { session_id: sessionId }});

        if (!user) {
            logger.error('[WS] startSubscription() -- Session id: ' + sessionId + ' - not found');
            ws.send(JSON.stringify({
                message: 'INVALID_SESSION',
                data: 'Session ID is invalid'
            }));
            return;
        }

        sessionData.session_users[sessionId] = user;

        if (!sessionData.timers[sessionId]) {
            sessionData.timers[sessionId] = setInterval(tickWrapper.bind(null, sessionId), 1000);
        }

        sessionData.previous_tick_data[sessionId] = {};
        sessionData.cached_data[sessionId] = {};
    } catch (err) {
        logger.error('[WS] Error starting WS subscription:');
        console.error(err);
    }
}

function connect(sessionStore, ws, req) {
    try {
        const cookies = require('cookie').parse(req.headers['cookie']);
        const sessionId = cookies['connect.sid'].split('.')[0].split(':')[1];

        if (!sessionData.ws_clients[sessionId]) {
            sessionData.ws_clients[sessionId] = ws;
        }

        startSubscription(sessionId);
    } catch (err) {
        logger.error('[WS] wsClient::connect() - error');
        logger.error(err);
    }
}

function tickWrapper(sessionId) {
    if (sessionData.ticking[sessionId] === true) {
        return;
    }

    sessionData.ticking[sessionId] = true;
    const ws = sessionData.ws_clients[sessionId];

    tick(sessionId)
    .then(() => {
        sessionData.ticking[sessionId] = false;
    })
    .catch((err) => {

        if (err['error'] && err['errorMsg']) {
            ws.send(JSON.stringify(err));
            logger.error('[WS] WS Error:');
            logger.error(err);
        } else if (err['response']) {
            ws.send(JSON.stringinfy({
                error: 'COMMS_ERROR',
                errorMsg: 'An error occurred making a request to an API',
                details: err.response
            }));
            logger.error('[WS] WS Error:');
            logger.error(err.response);
        } else {
            ws.send(JSON.stringify({
                error: 'UNKNOWN_ERROR',
                errorMsg: 'An unknown error occurred',
                details: err
            }));
            logger.error('[WS] WS Error:');
            logger.error(err);
        }
        sessionData.ticking[sessionId] = false;
        throw err;
    })
    .catch((err) => {
        sessionData.ticking[sessionId] = false;
        logger.error('---- UNHANDLED ERROR ----');
        console.error(err);
    })
}

async function get_cached_data(sessionId, methodName) {

    const statusClient = sessionData.status_clients[sessionId];

    if (!sessionData.cached_data[sessionId]) {
        sessionData.cached_data[sessionId] = {};
    }

    if (sessionData.cached_data[sessionId][methodName]) {
        if (Date.now() > (sessionData.cached_data[sessionId][methodName].expires + 2000)) {
            const res = await statusClient[methodName]();
            const expiresDate = new Date(res.headers['expires']);

            sessionData.cached_data[sessionId][methodName] = {
                data: res.data,
                expires: expiresDate.getTime()
            };
        }
    } else {
        const res = await statusClient[methodName]();
        const expiresDate = new Date(res.headers['expires']);
        sessionData.cached_data[sessionId][methodName] = {
            data: res.data,
            expires: expiresDate.getTime()
        };
    }

    return sessionData.cached_data[sessionId][methodName].data;
}

async function reportLocation(sessionId) {
    const ws = sessionData.ws_clients[sessionId];
    const universeClient = sessionData.universe_clients[sessionId];
    const statusClient = sessionData.status_clients[sessionId];

    const locationData = await get_cached_data(sessionId, 'location');

    if (JSON.stringify(locationData) !== JSON.stringify(sessionData.previous_tick_data[sessionId]['location'])) {

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

        sessionData.previous_tick_data[sessionId]['location'] = locationData;
    }
}

async function reportOnlineStatus(sessionId) {
    const ws = sessionData.ws_clients[sessionId];
    const statusClient = sessionData.status_clients[sessionId];

    const onlineData = await get_cached_data(sessionId, 'online');

    if (onlineData.online !== _.get(sessionData.previous_tick_data[sessionId], 'online.online')) {
        ws.send(JSON.stringify({
            message: 'online',
            data: {
                online: onlineData.online
            }
        }));
        sessionData.previous_tick_data[sessionId]['online'] = onlineData;
    }
}

async function reportMusicSourceStatus(sessionId) {
    const ws = sessionData.wsClients[sessionId];
    const ms = sessionData.musicSource
}


async function tick(sessionId) {
    try {
        const activeCharacter = await active_character(sessionId);
        if (!activeCharacter) {
            return;
        }
        await reportLocation(sessionId);
        await reportOnlineStatus(sessionId);
    } catch (err) {
        logger.error('Unhandled exception:');
        console.error(err);
    }

    /*
    const user = sessionData.sessionUsers[sessionId];
    const ws = sessionData.wsClients[sessionId];

    await user.reload();

    if (!user.active_character_id && sessionData.activeCharacterId[sessionId]) {
        logger.warn('[WS] Session no longer has an active character id');
        delete sessionData.characters[sessionId];
        delete sessionData.activeCharacterId[sessionId];
        delete sessionData.cachedData[sessionId];
        delete sessionData.statusClients[sessionId];
        delete sessionData.universeClients[sessionId];
        return;
    } else if (!user.active_character_id && !sessionData.activeCharacterId[sessionId]) {
        return;
    } else if (user.active_character_id !== sessionData.activeCharacterId[sessionId]) {
        logger.info('[WS] New active character id detected');

        const character = await user.getCharacters({
            where: {
                character_id: user.active_character_id
            }
        });

        if (!character[0]) {
            logger.error('[WS] New active character id does not exist or is not associated to the session');
            return;
        }

        sessionData.characters[sessionId] = character[0];
        sessionData.statusClients[sessionId] = new EveStatusClient(character[0], appConfig['eve']);
        sessionData.universeClients[sessionId] = new EveUniverseClient(character[0], appConfig['eve']);
        delete sessionData.cachedData[sessionId];
        sessionData.activeCharacterId[sessionId] = user.active_character_id;

        sessionData.wsClients[sessionId].send(JSON.stringify({
            message: 'active_character',
            data: {
                character_id: sessionData.activeCharacterId[sessionId]
            }
        }));

        return;
    }

    try {
        await reportLocation(sessionId);
        await reportOnlineStatus(sessionId);
    } catch (err) {
        logger.error('Error reporting');
        console.error(err);
    }
    */

}

module.exports = {
    connect,
    disconnect,
    tickWrapper,
    tick
};
