<template>
  <VFlex xs12>
    <VCard>
      <VToolbar
        card
        dark
      >
        <VToolbarTitle>EVE Online Account</VToolbarTitle>
      </VToolbar>
      <VCardText v-if="eve_enabled === false">
        <VBtn
          :loading="linking_eve"
          :disabled="linking_eve || config_loaded === false"
          @click="linkEve"
        >
          <img :src="eve_login">
        </VBtn>
      </VCardText>
      <VCardText v-else>
        Logged in as <strong>{{ account_name }}</strong>.
      </VCardText>
    </VCard>
  </VFlex>
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
            eve_login: require('@/assets/eve-login.png'),
            _authWindow: null
        };
    },

    methods: {

        linkEve() {

            this.linking_eve = true;

            const eveUrl = eve_authorize_endpoint +
            '?response_type=code' +
            '&client_id=' + this.client_id +
            '&scope=' + encodeURIComponent(this.scopes.join(' ')) +
            '&redirect_uri=' + encodeURIComponent(eve_authorize_redirect);

            this._authWindow = window.open('/api/eve/authenticate', 'eve_auth', 'menubar=no,location=no,resizable=no,scrollbars=yes,status=yes,toolbar=no,height=525,width=400');
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
        },

        onVerified(e) {
            this._authWindow.close();
            this.checkEve();
        }
    },

    beforeMount() {
        window.document.addEventListener('verified', this.onVerified);
    },

    beforeDestroy() {
        window.document.removeEventListener('verified', this.onVerified);
    },

    mounted() {
        // this.loadConfig();
        this.checkEve();
    }
}

</script>
