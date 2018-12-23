const getSessionData = require('./sessionState.js').get_state;
const get_logger = require('../../utils.js').get_logger;
const plugins = require('../../../plugins/music_sources/ejr-plugins-api.js');
const logger = get_logger();
const appConfig = require('../../config.js');
const _ = require('lodash');

async function active_musicsource(sessionId) {

    const state = getSessionData(sessionId);

    if (state.new_musicsource === true) {
        return;
    }

    state.new_musicsource = true

    const ws = state.ws_client;

    if (!state.user) {
        return false;
    }

    if (!state.active_musicsource_id) {
        if (state.user.active_musicsource_id) {
            state.active_musicsource_id = state.user.active_musicsource_id;
        }  else {
            logger.warn('No active character id');
            return false;
        }
    }

    if (!state.active_musicsource || state.active_musicsource_id !== state.active_musicsource.id) {
        logger.debug('Getting new music source instance setup for session:' + sessionId);

        const user = state.user;
        const musicSource = await user.getMusicSources({
            where: {
                id: state.active_musicsource_id

            }
        });

        if (!musicSource[0]) {
            state.new_musicsource = false;
            logger.error("What the server thinks is the active music source id for this session is not aligned with what is in the database");
            return;
        }
        state.active_musicsource = musicSource[0];
        state.active_musicsource_id = musicSource[0].id;

        const model = new plugins[musicSource[0].model_name].model(musicSource[0], appConfig);
        state.music_client = model;

        state.cached_data['music_client_status'] = null;
        state.cached_data['music_client_currentPlaylist'] = null;
        state.cached_data['music_client_currentPlaying'] = null;

        state.previous_tick_data['music_client_status'] = null;
        state.previous_tick_data['music_client_currentPlaylist'] = null;
        state.previous_tick_data['music_client_currentPlaying'] = null;

        ws.send(JSON.stringify({
            message: 'musicsource_active',
            data: musicSource[0]
        }));
    }
    state.new_musicsource = false;
    return state.active_musicsource;
}

async function get_music_client(sessionId) {
    const state = getSessionData(sessionId);
    const musicSource = await active_musicsource(sessionId);
    if (!musicSource) {
        return;
    }

    return state.music_client;
}

async function ms_status(sessionId) {
    const state = getSessionData(sessionId);
    const ws = state.ws_client;
    const client = await get_music_client(sessionId);
    if (!client) {
        return;
    }
    const musicSource = await active_musicsource(sessionId);
    if (!musicSource) {
        return;
    }
    const status = await client.status();

    if (status !== state.previous_tick_data['music_client_status']) {
        ws.send(JSON.stringify({
            message: 'musicsource_status',
            data: status
        }));
        state.previous_tick_data['music_client_status'] = status;
    }
}

async function ms_nowplaying(sessionId) {
    const state = getSessionData(sessionId);
    const ws = state.ws_client;
    const client = await get_music_client(sessionId);
    if (!client) {
        return;
    }
    const musicSource = await active_musicsource(sessionId);
    if (!musicSource) {
        return;
    }



    if (!state.previous_tick_data['music_client_nowPlaying']) {
        state.previous_tick_data['music_client_nowPlaying'] = {};
    }

    var sendmsg = false;

    var currentPlaying = await client.nowPlaying();
    if  (!currentPlaying) {
        currentPlaying = { playing: false };
    }

    if (currentPlaying.playing !== state.previous_tick_data['music_client_nowPlaying']['playing']) {
        sendmsg = true;
    }

    if (currentPlaying.item_id !== state.previous_tick_data['music_client_nowPlaying']['item_id']) {
        sendmsg = true;
    }

    if (sendmsg) {

        state.previous_tick_data['music_client_nowPlaying'] = currentPlaying;

        ws.send(JSON.stringify({
            message: 'musicsource_nowPlaying',
            data: currentPlaying
        }));
    }
}

module.exports = {
    ms_status,
    ms_nowplaying
}
