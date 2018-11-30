<template>
    <v-flex xs12>
        <v-card>
            <v-toolbar
                card
                dark>
                <v-toolbar-title>EVE Online Account</v-toolbar-title>
            </v-toolbar>
            <v-card-text v-if="eve_enabled === false">
                <v-btn
                    :loading="linking_eve"
                    :disabled="linking_eve || config_loaded === false"
                    @click="linkEve">
                        <img :src="eve_login"/>
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

const eve_authorize_endpoint = 'https://login.eveonline.com/v2/oauth/authorize/';
const eve_authorize_redirect = 'http://localhost:8080/api/eve/verify';

export default {
    data() {
        return {
            linking_eve: true,
            eve_enabled: false,
            account_name: '',
            config_loaded: true,
            api_state: '',
            client_id: '',
            scopes: [],
            eve_login: require('@/assets/eve-login.png')
        };
    },

    methods: {

        linkEve() {
            const eveUrl = eve_authorize_endpoint +
            '?response_type=code' +
            '&client_id=' + this.client_id +
            '&scope=' + encodeURIComponent(this.scopes.join(' ')) +
            '&state=' + encodeURIComponent(this.api_state) +
            '&redirect_uri=' + encodeURIComponent(eve_authorize_redirect);

            const eveWindow = window.open('/api/eve/authenticate', 'eve_auth', 'menubar=no,location=no,resizable=no,scrollbars=yes,status=yes,toolbar=no,height=425,width=350');
            eveWindow.onunload = () => {
                this.checkEve();
            };
        },

        refreshUserInfo() {
            return axios.get('/api/eve/user')
            .then((res) => {
                this.account_name = res.data.name;
            })
            .catch((err) => {
                console.error(err);
            });
        },

        checkEve() {
            this.eve_enabled = false;
            this.linking_eve = true;

            axios.get('/api/eve/status')
            .then((res) => {
                if (res.data['status'] === true) {
                    this.refreshUserInfo()
                    .then(() => {
                        this.eve_enabled = true;
                        this.linking_eve = false;
                        this.$emit('eve-enabled');
                    });
                } else {
                    this.eve_enabled = false;
                    this.linking_eve = false;
                    this.$emit('eve-disabled');
                }
            })
            .catch((err) => {
                console.error(err);
                this.eve_enabled = false;
                this.linking_eve = false;
                this.$emit('eve-disabled');
            });
        },

        loadConfig() {
            this.config_loaded = false;
            return axios.all([
                axios.get('/api/eve/clientId'),
                axios.get('/api/eve/scopes'),
                axios.get('/api/eve/state')
            ])
            .then(axios.spread((clientIdRes, scopesRes, stateRes) => {
                this.api_state = stateRes.data.state;
                this.client_id = clientIdRes.data.clientId;
                this.scopes = scopesRes.data.scopes;
                this.config_loaded = true;
            }));
        }
    },

    mounted() {
        // this.loadConfig();
        this.checkEve();
    }
}

</script>
