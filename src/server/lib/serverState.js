// Express and the WS server need to share session information

const state = function() {
    return {
        active_character: null,
        active_character_id: null,
        active_musicsource_id: null,
        active_musicsource: null,
        cached_data: null,
        previous_tick_data: null
    }
}

const store = {};

const get_store = function(sessionId) {
    if (!store[sessionId]) {
        store[sessionId] = state();
    }

    return store[sessionId];
}

module.exports = get_store;
