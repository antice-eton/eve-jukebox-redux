<template>
    <v-app id="ejr" dark>
        <Toolbar />
        <LeftDrawer />
        <RouterView />
    </v-app>
</template>

<style lang="scss">
.spotify-icon {
    width: 2em;
    height: 2em;
    vertical-align: middle;
}

.eve-icon {
    width: 2em;
    height: 2em;
    vertical-align: middle;
}
</style>
<script>
import axios from 'axios';
import Main from './views/Main.vue';

import Toolbar from './components/AppToolbar.vue';
import LeftDrawer from './components/LeftDrawer.vue';

export default {
    name: 'App',
    components: {
        Main,
        Toolbar,
        LeftDrawer
    },
    data () {
        return {
            loading: true,
            drawer: true
        }
    },

    computed: {
        spotify_icon() {
            return require('./assets/spotify-enabled.svg');
        },

        eve_icon() {
            return require('./assets/eve-logo.png');
        },

        character_id() {
            return this.$store.state.active_character_id;
        },

        character_name() {
            return this.$store.state.active_character_name;
        },

        character_portrait() {
            return '/portraits/' + this.character_id + '_512.jpg';
        },

        characters() {
            return this.$store.state.characters;
        }
    },

    watch: {
        character_id(newVal) {
            if (newVal) {
                this.drawer = true;
            } else {
                this.drawer = false;
            }
        }
    },

    created() {
        axios.get('/api/session/status')
        .then(() => axios.get('/api/eve/characters'))
        .then((res) => {
            this.$store.commit('SET_CHARACTERS', res.data.characters);
        })
        .then(() => axios.get('/api/eve/active_character'))
        .then((res) => {
            const char = res.data;
            this.$store.commit('ACTIVATE_CHARACTER', char);
            this.loading = false;
        })
        .catch((err) => {
            this.loading = false;
            console.error(err.response);
            this.$router.push('/login');
        });
    }
}
</script>
