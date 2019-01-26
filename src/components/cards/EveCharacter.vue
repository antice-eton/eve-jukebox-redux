<template>
<v-card dark max-width="1024">
    <v-card-title class="grey darken-4">EVE Jukebox Redux v1.0.0-beta</v-card-title>
    <v-card-text>
        <v-layout wrap>
            <v-flex xs6>
                <v-layout wrap>
                    <v-flex xs3 text-xs-center>
                        <v-progress-circular indeterminate v-if="loading_character"/>
                        <v-avatar size="100" v-else>
                            <img :src="'/api/eve/characters/' + character_id + '/portrait'">
                        </v-avatar>
                    </v-flex>
                    <v-flex class="ml-3" v-if="!loading_character">
                        <h4 class="text-uppercase font-weight-black text--darken-2">
                            Character
                        </h4>
                        <p>
                            {{ character_name }}
                        </p>

                        <h4 class="text-uppercase font-weight-black">
                            Status
                        </h4>
                        <p v-if="loading_online">
                            <v-progress-circular size="16" indeterminate/> LOADING
                        </p>
                        <p v-else-if="online === true">
                            <v-icon small>power</v-icon> ONLINE
                        </p>
                        <p v-else>
                            <v-icon small>power_off</v-icon> OFFLINE
                        </p>

                        <h4 class="text-uppercase font-weight-black">
                            Selected Music Player
                        </h4>
                        <p v-if="loading_musicplayer">
                            <v-progress-circular size="16" indeterminate/> LOADING
                        </p>
                        <p v-else-if="musicplayer_id === null">
                            <v-icon small>music_note</v-icon> No player selected
                        </p>
                        <template v-else>
                            <p class="mb-0">
                                <v-icon small>music_note</v-icon> {{ musicplayer_name }}
                            </p>
                            <p class="mt-0">
                                <v-icon small class="ma-0 pa-0">list</v-icon> {{ playlist_name }}
                            </p>
                        </template>
                    </v-flex>
                </v-layout>
            </v-flex>
            <v-flex xs6 v-if="loading_character"/>
            <v-flex xs6 v-else>
                <h4 class="text-uppercase font-weight-black text--darken-2">
                    Location <v-progress-circular size="16" indeterminate v-if="loading_location"/>
                </h4>
                <v-layout wrap v-if="loading_location === false">
                    <v-flex xs3>
                        <v-icon small>flare</v-icon> System:
                    </v-flex>
                    <v-flex xs9>
                        {{ location.system.name }} {{ location.system.security_status }}
                    </v-flex>
                    <v-flex xs3>
                        <v-icon small>bubble_chart</v-icon> Region:
                    </v-flex>
                    <v-flex xs9>
                        <span v-if="location.region">
                            {{ location.region.name }}
                        </span>
                    </v-flex>
                    <v-flex xs3>
                        <v-icon small>save_alt</v-icon> Docked:
                    </v-flex>
                    <v-flex xs9>
                        {{ (location.docked)? 'Yes' : 'No' }}
                    </v-flex>
                    <template v-if="location['station']">
                        <v-flex xs3>
                            <v-icon small>domain</v-icon> Station:
                        </v-flex>
                        <v-flex xs9>
                            {{ location.station.name }}
                        </v-flex>
                    </template>

                </v-layout>
            </v-flex>
        </v-layout>
    </v-card-text>
    <v-card-actions class="grey darken-1">
        <v-spacer/>
        <v-btn @click="logout">
            Logout
        </v-btn>
        <v-btn @click="loadCharactersCard" color="blue-grey darken-4">
            <v-icon class="mr-2">account_box</v-icon> Select Character
        </v-btn>
        <v-btn @click="loadMusicPlayersCard" color="blue-grey darken-4">
            <v-icon class="mr-2">music_note</v-icon> Select Music Player
        </v-btn>
        <v-btn @click="load_playlist_rules_card" :disabled="disable_playlist_rules_button" color="blue-grey darken-4">
            <v-icon class="mr-2">list</v-icon> Playlist Rules
        </v-btn>
    </v-card-actions>
    <v-dialog v-model="manage_characters" max-width="500">
        <EveCharactersCard @close="manage_characters = false" v-if="manage_characters" dialog/>
    </v-dialog>
    <v-dialog v-model="manage_musicplayers" max-width="500">
        <MusicPlayersCard @close="manage_musicplayers = false" v-if="manage_musicplayers" dialog/>
    </v-dialog>
    <v-dialog v-model="manage_playlists" max-width="1024" >
        <PlaylistRulesCard @close="manage_playlists = false; " class="elevation-20"  v-if="manage_playlists" dialog/>
    </v-dialog>
</v-card>
</template>

<script>

import EveCharactersCard from './EveCharacters.vue';
import MusicPlayersCard from './MusicPlayers.vue';
import PlaylistRulesCard from './PlaylistRulesCard.vue';

import _ from 'lodash';
import axios from 'axios';

export default {

    components: {
        EveCharactersCard,
        MusicPlayersCard,
        PlaylistRulesCard
    },

    data() {
        return {
            manage_characters: false,
            manage_musicplayers: false,
            manage_playlists: false,
            loading_character: true,
            loading_musicplayer: false,
            character_name: null,
            musicplayer_name: null,
            music_player: null,
            pr_card_counter: 0
        }
    },

    computed: {
        playlist_name() {
            if (this.$store.state.playlist) {
                return this.$store.state.playlist.display_name;
            } else {
                return '';
            }
        },

        playlist_id() {
            if (this.$store.state.playlist) {
                return this.$store.state.playlist.id;
            }
        },

        playlist() {
            return this.$store.state.playlist;
        },

        disable_playlist_rules_button() {
            return this.musicplayer_id === null;
        },

        character_id() {
            return this.$store.state.active_character_id;
        },

        musicplayer_id() {
            return this.$store.state.active_musicplayer_id;
        },

        socket_connected() {
            return this.$store.state.socket_connected;
        },

        character() {
            return this.$store.state.active_character;
        },

        online() {
            return this.$store.state.online;
        },

        location() {
            return this.$store.state.location;
        },

        loading_location() {
            return (this.$store.state.loading_location || this.$store.state.socket_connected === false);
        },

        loading_online() {
            return (this.$store.state.loading_online || this.$store.state.socket_connected === false);
        }
    },

    watch: {
        async playlist(newVal, oldVal) {
            if (!newVal) {
                return;
            }

            if (oldVal && oldVal.id === newVal.id) {
                return;
            }

            if (newVal.player_playlist_id === 'special-stop') {
                await axios.post('/api/music_players/' + newVal.player_id + '/stop');
            } else {
                await axios.post('/api/music_players/' + newVal.player_id + '/playlists/' + newVal.id + '/play');
            }
        },

        character_id(newVal) {
            if (newVal) {
                this.loadCharacter(newVal);
            }
        },

        musicplayer_id(newVal) {
            console.log('musicplayer id:', newVal);
            if (newVal) {
                this.loadMusicPlayer(newVal);
            }
        }
    },

    methods: {

        async loadCharactersCard() {
            this.manage_characters = true;
        },

        async loadMusicPlayersCard() {
            this.manage_musicplayers = true;
        },

        async load_playlist_rules_card() {
            this.pr_card_counter++;
            this.manage_playlists = true;
        },

        async logout() {
            await axios.post('/api/session/deactivate_character');
            this.$store.commit('DEACTIVATE_CHARACTER');
        },

        async loadMusicPlayer(player_id) {
            const res = await axios.get('/api/music_players/' + player_id);
            this.musicplayer_name = res.data.service_displayName;
        },

        async loadCharacter(character_id) {
            this.loading_character = true;
            if (!this.socket_connected) {
                console.log('Connecting to WS');
                this.$connect();
            }

            return axios.get('/api/eve/characters/' + character_id)
            .then((res) => {
                this.character_name = res.data.character_name
                this.loading_character = false;
                var timer = setInterval(() => {
                    if (this.socket_connected) {
                        this.$socket.send(JSON.stringify({message: 'reload'}));
                        clearInterval(timer);
                    } else {
                        this.$connect();
                    }
                }, 1000);
                // this.$socket.send(JSON.stringify({message: 'reload'}));
            });
        },
    },

    beforeDestroy() {
        console.log('Disconnecting websocket');
        this.$disconnect();
    },

    created() {
        if (this.character_id) {
            this.loadCharacter(this.character_id);
        }

        if (this.musicplayer_id) {
            this.loadMusicPlayer(this.musicplayer_id);
        }
    }
}
</script>
