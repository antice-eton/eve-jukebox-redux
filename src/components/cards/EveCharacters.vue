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
            You have no EVE Online characters registered!!
        </p>
        <v-list two-line v-else>
            <v-subheader>Characters</v-subheader>

            <v-list-tile
                v-for="char in characters"
                :key="char.character_id"
                avatar
                @click="activateCharacter(char)">
                <v-list-tile-avatar>
                    <img :src="'/portraits/' + char.character_id + '_512.jpg'" />
                </v-list-tile-avatar>

                <v-list-tile-content>
                    <v-list-tile-title>{{ char.character_name }}</v-list-tile-title>
                    <v-list-tile-sub-title>{{ char.character_id }}</v-list-tile-sub-title>
                </v-list-tile-content>

                <v-list-tile-action>
                    <v-btn icon ripple v-if="deleting_character !== char.character_id">
                        <v-icon @click.native.prevent="deleteCharacter(char.character_id)">delete</v-icon>
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
</v-card>
</template>

<script>

var __auth_window;
var __evt_timer;

import axios from 'axios';

export default {
    data() {
        return {
            loading: true,
            login_status: '',
            eve_login_logo: require('@/assets/eve-login.png'),
            session_id: null,
            session_time_left: null,
            deleting_character: null,
            __time_left_counter: null,
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

        },

        async loadCharacters() {
            return axios('/api/eve/characters')
            .then((res) => {
                this.characters = res.data.characters;
            });
        },

        async loadStatus() {
            return axios('/api/session/status')
            .then((res) => {
                console.log('status response:', res);
                this.session_id = res.data.session_id;
                this.session_time_left = res.data.time_left;

                this.__time_left_counter = setInterval(() => {
                    this.session_time_left = this.session_time_left - 1000;

                    if (this.session_time_left <= 0) {
                        this.session_time_left = 0;
                        clearInterval(this.__time_left_counter);
                    }
                },1000);
            });
        },

        async deleteCharacter(character_id) {
            this.deleting_character = character_id;
            return axios.delete('/api/eve/eve_characters/' + character_id)
            .then((res) => {
                return this.loadCharacters();
            })
            .then(() => {
                this.deleting_character = null;
                if (character_id === this.active_character_id) {
                    if (this.characters.length === 0) {
                        this.no_active_characters = true;
                        return;
                    }

                    const new_active_char = this.characters[0];
                    const new_active_id = this.characters[0].character_id;
                    const new_active_name = this.characters[0].character_name;

                    return this.activateCharacter(new_active_char);
                }
            });
        },

        async onRefreshEveCharacters() {
            this.adding_character = false;
            __auth_window.close();
            return this.loadCharacters();
        },

        async secondLoop() {
            if (__auth_window) {
                if (__auth_window.closed && this.adding_character === true) {
                    this.adding_character = false;
                    return this.loadCharacters();
                }

                if (this.session_time_left > 1000) {
                    this.session_time_left = this.session_time_left - 1000;
                } else if (this.session_time_left > 0) {
                    this.session_time_left = 0;
                }
            }
        },

        activateCharacter(char) {
            if (this.deleting_character) {
                return;
            }

            this.$store.dispatch('activate_character', char.character_id);
            this.$emit('cancel');
        }
    },

    beforeDestroy() {
        clearInterval(this.__time_left_counter);
        clearInterval(__evt_timer);
        window.document.removeEventListener('refresh-eve-characters', this.onRefreshEveCharacters);
    },

    mounted() {
        window.document.addEventListener('refresh-eve-characters', this.onRefreshEveCharacters);

        this.loadCharacters()
        .then(() => {
            __evt_timer = setInterval(() => {
                this.secondLoop();
            }, 1000);
            this.loading = false;
        });
    }
}

</script>
