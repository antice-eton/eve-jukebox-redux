<template>
<v-card raised dark>
    <v-card-title class="grey darken-4">Music</v-card-title>
    <v-card-text>
        <v-progress-circular indeterminate v-if="loading"/>
        <template v-else-if="totalMusicSources === 0">
            You have no music sources configured. Click the "Manage Music Sources" button below to add a new music source.
        </template>
        <template v-else>
            <v-layout wrap>
                <v-flex xs6>
                    <v-layout wrap>
                        <template v-if="loading_musicsource">
                            <v-progress-circular indeterminate/>
                        </template>
                        <template v-else>
                            <v-flex xs3>
                                <v-icon size="100" class="ma-0 pa-0">music_note</v-icon>
                            </v-flex>
                            <v-flex v-if="musicsource_id" class="ml-3">
                                <h4 class="text-uppercase font-weight-black grey--text">
                                    Music Source
                                </h4>
                                <p>
                                    {{ musicsource.service_name }}
                                </p>
                                <h4 class="text-uppercase font-weight-black grey--text">
                                    STATUS
                                </h4>
                                <p v-if="loading_musicsource_status" >
                                    <v-progress-circular size="16" indeterminate/> LOADING
                                </p>
                                <p v-else-if="musicsource_status === true">
                                    <v-icon small>power</v-icon> ONLINE
                                </p>
                                <p v-else>
                                    <v-icon small>power_off</v-icon> OFFLINE
                                </p>
                            </v-flex>
                            <v-flex v-else>
                                <h4 class="text-uppercase font-weight-black grey--text">
                                    Music Source
                                </h4>
                                <v-select
                                    :items="music_sources"
                                    item-text="service_name"
                                    item-value="id"
                                    v-model="selected_music_source"
                                    label="Choose a music source"/>

                            </v-flex>
                        </template>
                    </v-layout>
                </v-flex>
                <v-flex xs6 v-if="musicsource_status && !loading_musicsource">
                    <h4 class="text-uppercase font-weight-black grey--text">
                        Now Playing <v-progress-circular size="16" indeterminate v-if="loading_musicsource_nowPlaying"/>
                    </h4>
                    <template v-if="musicsource_nowPlaying && musicsource_nowPlaying['item_name']">
                        <p class="ma-0 pa-0">
                            {{ musicsource_nowPlaying['item_name'] }}
                        </p>
                        <p class="brown--text text--lighten-2">
                            {{ musicsource_nowPlaying_artists }}
                        </p>
                    </template>
                    <h4 class="text-uppercase font-weight-black grey--text">
                        Selected Playlist
                    </h4>
                    <p>
                        {{ selected_playlist }}
                    </p>
                </v-flex>
            </v-layout>
        </template>
        <template v-else>
            You have {{ totalMusicSources }} music source(s) available. Click "Manage Music Sources" to select one to use.
        </template>
    </v-card-text>
    <v-card-actions class="grey darken-4">
        <v-btn @click="musicsources_dialog = true"><v-icon class="mr-2">settings</v-icon> Manage Music Sources</v-btn>
        <v-btn v-if="musicsource_status" @click="manage_playlists_dialog = true"><v-icon class="mr-2">queue_music</v-icon> Manage Playlists</v-btn>
        <v-btn v-if="musicsource_status" @click="add_playlist_dialog = true"><v-icon class="mr-2">playlist_add</v-icon> Add Playlist</v-btn>
    </v-card-actions>

    <v-dialog v-model="musicsources_dialog"  max-width="500">
        <MusicSourcesCard @cancel="musicsources_dialog = false;" @delete-music-source="refresh"/>
    </v-dialog>

    <v-dialog v-model="add_playlist_dialog" max-width="500">
        <AddPlaylistStepper @cancel="add_playlist_dialog = false"/>
    </v-dialog>

    <v-dialog v-model="manage_playlists_dialog" max-width="500" scrollable persistent>
        <PlaylistManager @cancel="manage_playlists_dialog = false" :dialog="true" />
    </v-dialog>

</v-card>
</template>

<script>

import axios from 'axios';

import PlaylistManager from './PlaylistManager.vue';
import MusicSourcesCard from './MusicSources.vue';

import AddPlaylistStepper from '../steppers/AddPlaylist.vue';

export default {

    components: {
        MusicSourcesCard,
        PlaylistManager,
        AddPlaylistStepper
    },

    computed: {
        location() {
            return this.$store.state.location;
        },

        musicsource_id() {
            return this.$store.state.active_musicsource.id;
        },

        musicsource_name() {
            return this.$store.state.active_musicsource.service_name;
        },

        musicsource_status() {
            return this.$store.state.active_musicsource.status;
        },

        loading_musicsource() {
            return (this.$store.state.loading_musicsource || this.$store.state.socket_connected === false);
        },

        loading_musicsource_status() {
            return (this.$store.state.loading_musicsource_status || this.$store.state.socket_connected === false);
        },

        loading_musicsource_nowPlaying() {
            return (this.$store.state.loading_musicsource_nowPlaying || this.$store.state.socket_connected === false);
        },

        musicsource_nowPlaying() {
            return this.$store.state.active_musicsource.nowPlaying;
        },

        musicsource() {
            return this.$store.state.active_musicsource;
        },

        musicsource_nowPlaying_artists() {
            if (this.musicsource_nowPlaying) {
                const artists = this.musicsource_nowPlaying.item_artists.join(', ');
                return artists;
            }
        }
    },

    data() {
        return {
            musicsources_dialog: false,
            add_playlist_dialog: false,
            manage_playlists_dialog: false,
            add_playlist: false,
            selected_music_source: null,
            totalMusicSources: 0,
            loading: true,
            active_musicsource_id: null,
            status: false,
            selected_playlist: 'None',
            selected_playlist_id: null,
            music_sources: []
        }
    },

    watch: {
        selected_music_source(newVal) {
            if (newVal) {
                this.$store.dispatch('activate_musicsource', newVal);
            }
        },

        location(newVal) {
            this.refreshPlaylist();
        }
    },

    methods: {
        startAddPlaylist() {
            this.add_playlist = true;
        },

        startPlaylist(playlist_id) {
            axios.post('/api/music_sources/linked/' + this.musicsource_id + '/start_playlist', {
                playlist_id: playlist_id
            });
        },

        refreshPlaylist() {
            return axios.post('/api/music_sources/location_playlist', {
                location: this.location
            })
            .then((res) => {
                if (res.data) {
                    if (res.data.playlist_id !== this.selected_playlist_id) {
                        axios.post('/api/music_sources/linked/' + this.musicsource_id + '/playlists/' + res.data.playlist_id + '/play');
                        axios.get('/api/music_sources/linked/' + this.musicsource_id + '/playlists/' + res.data.playlist_id)
                        .then((plres) => {
                            this.selected_playlist = plres.data.name
                        });
                        this.selected_playlist_id = res.data.playlist_id;
                    }
                }
            })
            .catch((err) => {
                this.selected_playlist = null;
            });
        },

        refresh() {
            this.loading = true;
            axios.get('/api/music_sources/linked')
            .then((res) =>{
                this.totalMusicSources = res.data.musicSources.length;
                this.music_sources = res.data.musicSources;
                return axios.get('/api/music_sources/active');
            })
            .then((res) => {
                return this.$store.dispatch('activate_musicsource', res.data.id);
            })
            .then((res) => {
                return this.refreshPlaylist();
            })
            .catch((err) => {
                if (err['response'] && err['response'].status === 404) {
                    this.active_musicsource_id = null;
                    this.status = false;
                    this.music_source = null;
                }
            })
            .then(() => {
                this.loading = false;
            });
        }
    },

    mounted() {
        this.refresh();
    }

}

</script>
