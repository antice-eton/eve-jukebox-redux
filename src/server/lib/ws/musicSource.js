const getSessionData = require('./sessionState.js').get_state;
const get_logger = require('../../utils.js').get_logger;
const plugins = require('../../../plugins/music_sources/ejr-plugins-api.js');
const logger = get_logger();
const appConfig = require('../../config.js');
const _ = require('lodash');

async function refresh_musicsource(sessionId) {
    const state = getSessionData(sessionId);
    const ws = state.ws_client;

    const musicSources = await state.user.getMusicSources({
        where: {
            id: state.user.active_musicsource_id
        }
    });

    if (!musicSources[0]) {
        state.refresh_user = true;
        return;
    }

    state.active_musicsource = musicSources[0];
    state.active_musicsource_id = state.active_musicsource.id;

    const model = new plugins[state.active_musicsource.model_name].model(state.active_musicsource, appConfig);
    state.music_client = model;

    ws.send(JSON.stringify({
        message: 'active-musicsource',
        data: {
            musicsource_id: state.active_musicsource_id,
            service_id: state.active_musicsource.service_id,
            service_name: state.active_musicsource.service_name,
            service_displayName: state.active_musicsource.service_displayName
        }
    }));
    state.previous_tick_data['ms'] = {};
    state.cached_data['ms'] = {};
    state.refresh_active_musicsource = false;
}

async function tick(sessionId) {
    const state = getSessionData(sessionId);
    const ws = state.ws_client;

    if (state.active_musicsource_id !== state.user.active_musicsource_id) {
        state.refresh_active_musicsource = true;
    }

    if (state.refresh_active_musicsource) {
        logger.debug('Reloading active musicsource');
        await refresh_musicsource(sessionId);
    }

    await report_ms_status(sessionId);
    await report_ms_nowplaying(sessionId);
}

async function report_ms_status(sessionId) {
    const state = getSessionData(sessionId);
    const ws = state.ws_client;
    const client = state.music_client;
    if (!client) {
        return;
    }

    const status = await client.status();

    if (status !== state.previous_tick_data['ms']['music_client_status']) {
        ws.send(JSON.stringify({
            message: 'musicsource_status',
            data: status
        }));
        state.previous_tick_data['ms']['music_client_status'] = status;
    }
}

async function report_ms_nowplaying(sessionId) {
    const state = getSessionData(sessionId);
    const ws = state.ws_client;
    const client = state.music_client;

    if (!client) {
        return;
    }


    if (!state.previous_tick_data['ms']['music_client_nowPlaying']) {
        state.previous_tick_data['ms']['music_client_nowPlaying'] = {};
    }

    var sendmsg = false;

    var currentPlaying = await client.nowPlaying();
    if  (!currentPlaying) {
        currentPlaying = { playing: false };
    }

    if (currentPlaying.playing !== state.previous_tick_data['ms']['music_client_nowPlaying']['playing']) {
        sendmsg = true;
    }

    if (currentPlaying.item_id !== state.previous_tick_data['ms']['music_client_nowPlaying']['item_id']) {
        sendmsg = true;
    }

    if (sendmsg) {

        state.previous_tick_data['ms']['music_client_nowPlaying'] = currentPlaying;

        ws.send(JSON.stringify({
            message: 'musicsource_nowPlaying',
            data: currentPlaying
        }));
    }
}

module.exports = {
    report_ms_status,
    report_ms_nowplaying,
    tick
}
