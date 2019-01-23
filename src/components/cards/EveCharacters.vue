<template>
<v-card class="elevation-12">
    <v-toolbar dark>
        <v-toolbar-title>EVE Online Characters</v-toolbar-title>
    </v-toolbar>
    <v-card-text v-if="loading">
        <v-progress-circular
        indeterminate
        />
    </v-card-text>

    <v-card-text v-else>
        <p v-if="characters.length === 0">
            You have no EVE Online characters registered. Click the button below to add a character.
        </p>
        <v-list two-line v-else>
            <v-subheader>Characters</v-subheader>

            <v-list-tile
                v-for="char in characters"
                :key="char.character_id"
                avatar
                 @click="activateCharacter(char)"
                >
                <v-list-tile-avatar>
                    <img :src="'/api/eve/characters/' + char.character_id + '/portrait'" />
                </v-list-tile-avatar>

                <v-list-tile-content>
                    <v-list-tile-title>{{ char.character_name }}</v-list-tile-title>
                    <v-list-tile-sub-title>{{ char.character_id }}</v-list-tile-sub-title>
                </v-list-tile-content>

                <v-list-tile-action>
                    <v-btn icon ripple v-if="delete_character_id !== char.character_id" @click.native.prevent="confirmDeleteCharacter($event, char.character_id)">
                        <v-icon>delete</v-icon>
                    </v-btn>
                    <v-progress-circular
                    indeterminate
                    v-else/>
                </v-list-tile-action>
            </v-list-tile>
        </v-list>
        <p>
            To add characters, click the button below.
        </p>
        <v-layout>
            <v-flex transition="fade-transition" v-if="adding_character === false">
                <v-img :src="eve_login_logo" @click="doLogin" width="195" height="30"/>
            </v-flex>
            <v-flex v-else transition="fade-transition">
                <v-progress-circular
                :size="25"
                indeterminate
                transition="fade-transition"
                />
            </v-flex>
        </v-layout>
    </v-card-text>

    <v-dialog v-model="confirm_delete_modal" persistent max-width="280">
        <v-card>
            <v-card-title class="headline">Confirm Deletion</v-card-title>
            <v-card-text>Are you sure you want to delete this character?</v-card-text>
            <v-card-actions>
                <v-spacer/>
                <v-btn flat @click="confirm_delete_modal = false; delete_character_id = null">No</v-btn>
                <v-btn flat @click="deleteCharacter">Yes</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

</v-card>
</template>

<script>


var __auth_window_check_timer;
var __auth_window;

import axios from 'axios';


export default {
    data() {
        return {
            confirm_delete_modal: false,
            delete_character_id: null,
            loading: true,
            login_status: '',
            eve_login_logo: require('@/assets/eve-login.png'),
            session_id: null,
            session_time_left: null,
            deleting_character: null,
            adding_character: false,
            characters: []
        }
    },

    computed: {
        active_character_id() {
            return this.$store.state.active_character_id;
        }
    },

    methods: {
        doLogin() {
            this.adding_character = true;
            __auth_window = window.open('/api/eve/login', 'eve_auth', 'menubar=no,location=no,resizable=no,scrollbars=yes,status=yes,toolbar=no,height=525,width=400');
            __auth_window_check_timer = setInterval(() => {
                this.authWindowCheck();
            });
        },

        confirmDeleteCharacter(evt, characterId) {
            evt.stopPropagation();
            evt.preventDefault();
            console.log('confirm delete character');
            this.delete_character_id = characterId;
            this.confirm_delete_modal = true;
            return false;
        },

        async loadCharacters() {
            this.loading = true;
            return axios('/api/eve/characters')
            .then((res) => {
                this.loading = false;
                this.characters = res.data.characters;
            });
        },

        async loadStatus() {
            return axios('/api/session/status')
            .then((res) => {
                this.session_id = res.data.session_id;
            });
        },

        async deleteCharacter(delete_character_id) {
            if (!this.delete_character_id) {
                console.error('No character id to delete');
                return;
            }

            const character_id = this.delete_character_id;

            return axios.delete('/api/eve/characters/' + character_id)
            .then(async (res) => {

                this.confirm_delete_modal = false;

                if (character_id == this.active_character_id) {
                    await axios.post('/api/session/deactivate_character');
                    this.$store.commit('DEACTIVATE_CHARACTER_ID');
                }

                this.delete_character_id = null;

                return this.loadCharacters();
            });
        },

        async onRefreshEveCharacters() {
            this.adding_character = false;
            __auth_window.close();
            return this.loadCharacters();
        },

        async authWindowCheck() {
            if (__auth_window) {
                if (__auth_window.closed && this.adding_character === true) {
                    this.adding_character = false;
                    clearInterval(__auth_window_check_timer);
                    return this.loadCharacters();
                }
            }
        },

        async activateCharacter(char) {
            if (this.deleting_character) {
                return;
            }

            await axios.post('/api/session/activate_character', { character_id: char.character_id });
            this.$store.commit('ACTIVATE_CHARACTER_ID', char.character_id);
            this.$emit('cancel');
        }
    },

    beforeDestroy() {
        clearInterval(__auth_window_check_timer);
        window.document.removeEventListener('refresh-eve-characters', this.onRefreshEveCharacters);
    },

    mounted() {
        window.document.addEventListener('refresh-eve-characters', this.onRefreshEveCharacters);
        this.loadCharacters();
    }
}

</script>
