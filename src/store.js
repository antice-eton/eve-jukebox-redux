import Vue from 'vue';
import Vuex from 'vuex';

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

        active_character_id: null,
        active_character_name: null,
        active_character: null,
        characters: [],

        musicsource_status: null,
        musicsource_active: null,
        musicsource_nowPlaying: null,
        musicsource_playing: false,
        loading_musicsource_status: true,
        loading_musicsource_active: true,
        loading_musicsource_nowPlaying: true
    },

    mutations: {
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
            if (msg.message === 'online') {
                state.online = msg.data.online;
                state.loading_online = false;
            } else if (msg.message === 'location') {
                state.location = msg.data;
                state.loading_location = false;
            } else if (msg.message === 'musicsource_active') {
                state.musicsource_active = msg.data;
                state.active_musicsource_id = msg.data.id;
                state.active_musicsource_name = msg.data.source_name;
                state.loading_musicsource_active = false;
            } else if (msg.message === 'musicsource_status') {
                state.musicsource_status = msg.data;
                state.loading_musicsource_status = false;
            } else if (msg.message === 'musicsource_nowPlaying') {
                state.musicsource_nowPlaying = msg.data;
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
        },

        ACTIVATE_CHARACTER(state, character) {
            state.active_character_id = character.character_id;
            state.active_character_name = character.character_name;
            state.active_character = character;
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
    }
});
