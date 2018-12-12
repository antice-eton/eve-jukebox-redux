<template>
<v-card>
    <v-card-title>
        Link Spotify
    </v-card-title>
    <v-card-text>
        Before you can continue, you must link your spotify account.
    </v-card-text>
    <v-card-actions>
        <v-progress-circular
        :size="25"
        indeterminate
        v-if="linking_spotify"
        />
        <template v-else>
            <v-btn @click="linkSpotify" v-if="spotify_user === null">Link Spotify</v-btn>
        </template>
    </v-card-actions>
</v-card>
</template>

<script>

var __auth_window;

import axios from 'axios';

export default {

    data() {
        return {
            spotify_user: null,
            linking_spotify: false
        }
    },

    methods: {
        linkSpotify() {
            this.linking_spotify = true;
            __auth_window = window.open('/api/ms/spotify/login', 'spotify_auth', 'menubar=no,location=no,resizable=no,scrollbars=yes,status=yes,toolbar=no,height=525,width=400');
        },

        onRefreshSpotify() {

            console.log('Refresh spotify!!!!');

            if (__auth_window) {
                __auth_window.close();
            }

            axios.get('/api/ms/spotify/user')
            .then((res) => {
                this.spotify_user = res.data.user_displayName;
                this.linking_spotify = false;
                this.$emit('source-added');
            });
        }
    },
    beforeDestroy() {
        window.document.removeEventListener('spotify-linked', this.onRefreshSpotify);
    },

    mounted() {
        window.document.addEventListener('spotify-linked', this.onRefreshSpotify);
    }
}

</script>
