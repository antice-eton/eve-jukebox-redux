import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        socket_error: false,
        socket_connected: false,
        socket_reconnecting: false,
        socket_reconnecting_error: false,

        loading_online: true,
        loading_location: true,
        online: null,
        location: {
            region: null,
            system: null,
            faction: null,
            station: null,
            docked: false
        },

        playlist: null,

        loading_character: true,
        active_character_id: null,
        active_musicplayer_id: null,
        active_character_name: null,

        active_musicsource: {
            id: null,
            service_id: null,
            service_name: null,
            service_displayName: null,
            status: false,
            nowPlaying: null
        },

        active_musicsource_nowPlaying: null,
        active_musicsource_playing: false,
        active_musicsource_status: null,
        loading_musicsource: true,
        loading_musicsource_status: true,
        loading_musicsource_nowPlaying: true
    },

    mutations: {
        LOADING_CHARACTER(state) {
            state.loading_character = true;
            state.loading_online = true;
            state.loading_location = true;
        },

        LOADING_MUSICSOURCE(state) {
            state.loading_musicsource = true;
            state.loading_musicsource_status = true;
            state.loading_musicsource_nowPlaying = true;
        },

        SOCKET_ONOPEN(state, event) {
            state.socket_connected = true;
            state.socket_error = false;
            state.socket_reconnecting = false;
            state.socket_reconnecting_error = false;
        },

        SOCKET_ONCLOSE(state, event) {
            state.socket_connected = false;
        },

        SOCKET_ONERROR(state, event) {
            console.error('WS Error:', event);
            state.socket_error = true;
            state.socket_connected = false;
        },

        SOCKET_RECONNECT(state, event) {
            state.socket_reconnecting = true;
        },

        SOCKET_RECONNECT_ERROR(state, event) {
            state.socket_reconnecting = false;
            state.socket_reconnecting_error = event;
            console.error('WS Error:', event);
        },

        SOCKET_ONMESSAGE(state, msg) {

            if (msg.message === 'active-character') {
                state.active_character_id = msg.data.character_id;
                state.active_character_name = msg.data.character_name;
                state.loading_character = false;
                state.loading_online = true;
                state.loading_location = true;
            } else if (msg.message === 'active-musicsource') {

                state.active_musicsource.id = msg.data.musicsource_id;
                state.active_musicsource.service_name = msg.data.service_name;
                state.active_musicsource.service_id = msg.data.service_id;
                state.active_musicsource.service_displayName = msg.data.service_displayName;

                state.loading_musicsource = false;
                state.loading_musicsource_status = true;
                state.loading_musicsource_nowplaying = true;


            } else if (msg.message === 'online') {
                state.online = msg.data.online;
                state.loading_online = false;
            } else if (msg.message === 'location') {
                state.location = msg.data;
                state.loading_location = false;
            } else if (msg.message === 'playlist') {
                state.playlist = msg.data;
            } else if (msg.message === 'musicsource_active') {
                state.musicsource_active = msg.data;
                state.active_musicsource_id = msg.data.id;
                state.active_musicsource_name = msg.data.source_name;
                state.loading_musicsource_active = false;
            } else if (msg.message === 'musicsource_status') {
                state.active_musicsource.status = msg.data;
                state.loading_musicsource_status = false;
            } else if (msg.message === 'musicsource_nowPlaying') {
                state.active_musicsource.nowPlaying = msg.data;
                state.loading_musicsource_nowPlaying = false;
            }
            console.log('socket message:', msg);
        },

        SET_ONLINE_STATUS(state, status) {
            state.online = status;
        },

        ACTIVATE_CHARACTER_ID(state, charId) {
            state.active_character_id = charId;
            state.loading_online = true;
            state.loading_location = true;
            state.online = null;
            state.playlist = null;
        },

        ACTIVATE_MUSICPLAYER_ID(state, playerId) {
            state.active_musicplayer_id = playerId;
        },

        DEACTIVATE_CHARACTER(state) {
            state.active_character_id = null;
            state.palylist = null;
            state.active_musicplayer_id = null;
            state.active_musicsource_name = null;
            state.musicsource_active = null;
            state.active_musicsource = {
                id: null,
                service_id: null,
                service_name: null,
                service_displayName: null,
                status: false,
                nowPlaying: null
            };
        },

        ACTIVATE_CHARACTER(state, character) {
            state.active_character_id = character.character_id;
            state.active_character_name = character.character_name;
            state.loading_online = true;
            state.loading_location = true;
        },

        RESET_ACTIVATION(state) {
            state.active_character_id = null;
            state.active_character_name = null;
            state.loading_online = true;
            state.loading_location = true;
        },

        SET_CHARACTERS(state, characters) {
            state.characters = characters;
        },

        ADD_CHARACTER(state, character) {
            state.characters.push(character);
        }
    },

    actions: {
        async activate_character(context, characterId) {
            return axios.post('/api/session/activate_character', {
                character_id: characterId
            })
            .then(() => {
                context.commit('ACTIVATE_CHARACTER_ID', characterId);
            });
        },

        async activate_musicplayer(context, sourceId) {
            context.commit('ACTIVATE_MUSICPLAYER_ID', sourceId);
        }
    }
});
