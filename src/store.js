import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        active_character_id: null,
        active_character_name: null,
        characters: []
    },

    mutations: {
        ACTIVATE_CHARACTER_ID(state, charId) {
            state.active_character_id = charId;
        },

        ACTIVATE_CHARACTER(state, character) {
            state.active_character_id = character.character_id;
            state.active_character_name = character.character_name;
        },

        RESET_ACTIVATION(state) {
            state.active_character_id = null;
            state.active_character_name = null;
        },

        SET_CHARACTERS(state, characters) {
            state.characters = characters;
        },

        ADD_CHARACTER(state, character) {
            state.characters.push(character);
        }
    },

    actions: {

    }
});
