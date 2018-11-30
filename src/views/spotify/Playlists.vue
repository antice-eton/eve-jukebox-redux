<template>
    <v-flex xs6>
        <v-card>
            <v-toolbar card dark>
                <v-toolbar-title>Playlists</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
                <p>List of available playlists for the current account.</p>
                <v-btn
                    :loading="refreshing_playlists"
                    :disabled="refreshing_playlists"
                    @click="refreshPlaylists">
                        Refresh Playlists
                </v-btn>
            </v-card-text>

            <v-list dense>
                <v-list-tile
                    v-for="(playlist, pidx) in playlists"
                    :key="playlist.id">
                        <v-list-tile-avatar>
                            <v-icon>queue_music</v-icon>
                        </v-list-tile-avatar>
                        <v-list-tile-content>
                            <v-list-tile-title>{{ playlist.name }}</v-list-tile-title>
                            <v-list-tile-sub-title>Total tracks: {{ playlist.tracks.total }}</v-list-tile-sub-title>
                        </v-list-tile-content>
                        <v-list-tile-action>
                            <v-btn @click="startPlaylist(pidx)">
                                <v-icon>play_arrow</v-icon>
                            </v-btn>
                        </v-list-tile-action>
                </v-list-tile>
            </v-list>

        </v-card>
    </v-flex>
</template>

<script>

import axios from 'axios';

export default {
    data() {
        return {
            playlists: [],
            refreshing_playlists: false
        }
    },

    methods: {
        refreshPlaylists() {
            this.refreshing_playlists = false;

            axios.get('/api/spotify/playlists')
            .then((res) => {
                this.refreshing_playlists = false;
                this.playlists = res.data.items;
            });
        },

        startPlaylist(pidx) {
            const playlist = this.playlists[pidx];

            if (!playlist) {
                console.error('Invalid playlist index: ' + playlist);
                return;
            }

            axios.post('/api/spotify/play', {
                uri: playlist.uri
            })
            .then((res) => {
                if (res.data['ok'] === true) {
                    console.log('tada!!');
                } else {
                    console.error('Failed to play playlist:', res.data);
                }
            });
        }
    }
}
</script>
