<template>
<v-card>
    <v-card-text>
        Press the Login button below to link your Spotify account to EVE Jukebox Redux.
    </v-card-text>
    <v-card-actions>
        <v-spacer />
        <v-progress-circular
        :size="25"
        indeterminate
        v-if="linking_spotify"
        />
        <template v-else>

            <v-btn @click="$emit('cancel')">Cancel</v-btn>
            <v-btn @click="linkSpotify" v-if="spotify_user === null" color="blue-grey darken-2">Login</v-btn>
        </template>
    </v-card-actions>
</v-card>
</template>

<script>

var __auth_window;
var __auth_window_check_timer;

import axios from 'axios';

export default {

    data() {
        return {
            spotify_user: null,
            linking_spotify: false,
            __auth_window_check_timer: null
        }
    },

    methods: {
        linkSpotify() {
            this.linking_spotify = true;
            __auth_window = window.open('/api/mp/spotify/login', 'spotify_auth', 'menubar=no,location=no,resizable=no,scrollbars=yes,status=yes,toolbar=no,height=525,width=400');

            __auth_window_check_timer = setInterval(() => {
                this.authWindowCheck();
            },1000);
        },

        onRefreshSpotify() {

            console.log('Refresh spotify!!!!');

            if (__auth_window) {
                __auth_window.close();
            }

            this.$emit('player-added');
            /*

            axios.get('/api/mp/spotify/user')
            .then((res) => {
                this.spotify_user = res.data.user_displayName;
                this.linking_spotify = false;
                this.$emit('source-added');
            });
            */
        },

        async authWindowCheck() {
            if (__auth_window) {
                if (__auth_window.closed && this.linking_spotify === true) {
                    this.linking_spotify = false;
                    clearInterval(__auth_window_check_timer);
                }
            }
        },
    },
    beforeDestroy() {
        window.document.removeEventListener('spotify-linked', this.onRefreshSpotify);
    },

    mounted() {
        window.document.addEventListener('spotify-linked', this.onRefreshSpotify);
    }
}

</script>
