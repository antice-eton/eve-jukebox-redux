<template>
  <v-layout row wrap>
    <Account
      @spotify-enabled="onSpotifyEnabled"
      @spotify-disabled="onSpotifyDisabled"
    />
    <Devices v-if="spotify_enabled" />
    <Playlists v-if="spotify_enabled" />
</v-layout>
</template>

<script>

import axios from 'axios';


import Account from './spotify/Account.vue';
import Devices from './spotify/Devices.vue';
import Playlists from './spotify/Playlists.vue';

export default {
    components: {
        Devices,
        Playlists,
        Account
    },

    data() {
        return {
            spotify_enabled: false
        }
    },

    computed: {
        spotify_icon() {
            if (this.spotify_enabled) {
                return require('@/assets/spotify-enabled.svg');
            } else {
                return require('@/assets/spotify-disabled.svg');
            }
        }
    },

/*
    watch: {
        spotify_enabled(newVal) {
            if (newVal === true) {
                this.refreshUserInfo();
            }
        }
    },
*/
    methods: {
        onSpotifyEnabled() {
            this.spotify_enabled = true;
        },

        onSpotifyDisabled() {
            this.spotify_enabled = false;
        }
    }
}
</script>
