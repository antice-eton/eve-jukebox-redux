<template>
    <v-flex xs12>
        <v-card>
            <v-toolbar
                card
                dark>
                <v-toolbar-title>Spotify Account</v-toolbar-title>
            </v-toolbar>
            <v-card-text v-if="spotify_enabled === false">
                <v-btn
                    :loading="linking_spotify"
                    :disabled="linking_spotify || config_loaded === false"
                    @click="linkSpotify">
                        Connect to Spotify
                </v-btn>
            </v-card-text>
            <v-card-text v-else>
                Logged in as <strong>{{ account_name }}</strong>.
            </v-card-text>
        </v-card>
    </v-flex>
</template>

<script>

import axios from 'axios';

const spotify_authorize_endpoint = 'https://accounts.spotify.com/authorize';
const spotify_authorize_redirect = 'http://localhost:8080/api/spotify/verify';

export default {
    data() {
        return {
            linking_spotify: false,
            spotify_enabled: false,
            account_name: '',
            config_loaded: true,
            client_id: '',
            scopes: []
        };
    },

    methods: {
        linkSpotify() {
            this.linking_spotify = true;

            const spotifyUrl = spotify_authorize_endpoint +
            '?response_type=code' +
            '&client_id=' + this.client_id +
            '&scope=' + encodeURIComponent(this.scopes.join(' ')) +
            '&redirect_uri=' + encodeURIComponent(spotify_authorize_redirect);

            const spotifyWindow = window.open('/api/spotify/authenticate', 'spotify_auth', 'menubar=no,location=no,resizable=no,scrollbars=yes,status=yes,toolbar=no,height=425,width=350');
            spotifyWindow.onunload = () => {
                this.checkSpotify();
            };
        },

        checkSpotify() {

            this.linking_spotify = true;

            axios.get('/api/spotify/status')
            .then((res) => {
                if (res.data['status'] === true) {
                    this.refreshUserInfo()
                    .then(() => {
                        this.spotify_enabled = true;
                        this.linking_spotify = false;
                        this.$emit('spotify-enabled');
                    });
                } else {
                    this.spotify_enabled = false;
                    this.linking_spotify = false;
                    this.$emit('spotify-disabled');
                }
            })
            .catch((err) => {
                console.error(err);
                this.spotify_enabled = false;
                this.linking_spotify = false;
                this.$emit('spotify-disabled');
            });
        },

        refreshUserInfo() {
            return axios.get('/api/spotify/user')
            .then((res) => {
                this.account_name = res.data.display_name;
            });
        },

        loadConfig() {
            this.config_loaded = false;
            axios.all([
                axios.get('/api/spotify/clientId'),
                axios.get('/api/spotify/scopes')
            ])
            .then(axios.spread((clientIdRes, scopesRes) => {
                this.client_id = clientIdRes.data.clientId;
                this.scopes = scopesRes.data.scopes;
                this.config_loaded = true;
            }));
        },

        onSpotifyVerified(e) {
            console.log('spotify verified!', e);
        }
    },

    beforeMount() {
        window.document.addEventListener('spotify-verified', this.onSpotifyVerified);
    },

    beforeDestroy() {
        window.document.removeEventListener('spotify-verified', this.onSpotifyVerified);
    },

    mounted() {
    //    this.loadConfig();
        this.checkSpotify();
    }
}

</script>
