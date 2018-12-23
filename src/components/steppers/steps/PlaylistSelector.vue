<template>
<v-card>
    <v-card-text>
        Choose Playlist
        <v-autocomplete
            v-model="selected_playlist"
            :items="playlists"
            :loading="loading_playlists"
            :search-input.sync="query_playlist"
            dense
            menu-props="closeOnClick, closeOnContentClick"
            item-text="name"
            item-value="id"
            label="Type in a playlist name"
            return-object/>
    </v-card-text>
    <v-card-actions>
        <v-btn @click="selected_playlist = ''; $emit('cancel')">Cancel</v-btn>
        <v-btn @click="$emit('next', selected_playlist)" :disabled="!selected_playlist">Save</v-btn>
    </v-card-actions>
</v-card>
</template>

<script>

import axios from 'axios';

export default {
    data() {
        return {
            selected_playlist: '',
            playlists: [],
            loading_playlists: false,
            query_playlist: ''
        };
    },

    computed: {
        musicsource_id() {
            return this.$store.state.active_musicsource.id;
        },

        musicsource_name() {
            return this.$store.state.active_musicsource.name;
        },
    },

    watch: {
        query_playlist(newVal) {
            if (!newVal || this.loading_playlists === true) {
                return;
            }

            this.loading_playlists = true;

            axios.get('/api/music_sources/linked/' + this.musicsource_id + '/playlists')
            .then((res) => {
                this.playlists = res.data;
                this.loading_playlists = false;
            });
        }
    }
}
</script>
