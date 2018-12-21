<template>
<v-card raised dark>
    <v-card-title class="grey darken-4">Music</v-card-title>
    <v-card-text>
        <v-progress-circular indeterminate v-if="loading"/>
        <template v-else-if="totalMusicSources === 0">
            You have no music sources configured. Click the "Manage Music Sources" button below to add a new music source.
        </template>
        <template v-else-if="active_musicsource_id">
            <v-layout wrap>
                <v-flex xs6>
                    <h4 class="text-uppercase font-weight-black text--darken-2">
                        Music Source
                    </h4>
                </v-flex>
            </v-layout>
        </template>
        <template v-else>
            You have {{ totalMusicSources }} music source(s) available. Click "Manage Music Sources" to select one to use.
        </template>
    </v-card-text>
    <v-card-actions class="grey darken-4">
        <v-btn @click="$router.push('/music-sources')"><v-icon class="mr-2">settings</v-icon> Manage Music Sources</v-btn> <v-btn @click="$router.push('/playlists')">Manage Playlists</v-btn>
    </v-card-actions>
</v-card>
</template>

<script>

import axios from 'axios';

export default {

    data() {
        return {
            totalMusicSources: 0,
            loading: true,
            active_musicsource_id: null,
            status: false,
            music_source: null
        }
    },

    watch: {
        active_musicsource_id(newVal) {
            if (!newVal) {
                return;
            }

            axios.get('/api/music_sources/linked/' + this.active_musicsource_id + '/status')
            .then((res) => {
                this.status = res.data.status;
            });
        }
    },

    created() {



        axios.get('/api/music_sources/active')
        .then((res) => {
            this.active_musicsource_id = res.data.active_musicsource_id
            return axios.get('/api/music_sources/linked');
        })
        .then((res) => {
            this.totalMusicSources = res.data.musicSources.length;
            this.loading = false;
        });
    }

}

</script>
