<template>
<v-app id="ejr" dark>
    <router-view/>
    <!--
    <v-content>
        <v-container>
            <v-layout wrap>
                <v-flex xs12>
                    <h1 class="mb-1 display-1">EVE Jukebox Redux</h1>
                </v-flex>
                <v-flex xs12>
                    <v-card raised dark>
                        <v-card-title class="grey darken-4">Active Character</v-card-title>
                        <v-card-text>
                            <v-layout wrap>
                                <v-flex xs6>
                                    <v-layout wrap>
                                        <v-flex xs3>
                                            <v-avatar size="100">
                                                <img :src="active_character_portrait">
                                            </v-avatar>
                                        </v-flex>
                                        <v-flex class="ml-3">
                                            <h4 class="text-uppercase font-weight-black text--darken-2">
                                                Active Character
                                            </h4>
                                            <p>
                                                {{ active_character_name }}
                                                <v-list class="ma-0 pa-0">
                                                    <v-list-tile @click="" class="ma-0 pa-0">
                                                        <v-list-tile-content class="caption ma-0 pa-0">
                                                            ZKillBoard
                                                        </v-list-tile-content>
                                                    </v-list-tile>
                                                </v-list>
                                            </p>

                                            <h4 class="text-uppercase font-weight-black">
                                                Status
                                            </h4>
                                            <p>
                                                OFFLINE
                                            </p>
                                        </v-flex>
                                    </v-layout>
                                </v-flex>
                                <v-flex xs6>
                                    <h1>Status:</h1>
                                    <p>Who knows</p>
                                </v-flex>
                            </v-layout>
                        </v-card-text>
                        <v-card-actions class="grey darken-4">
                            <v-btn @click="$router.push('/eve-character-management')"><v-icon class="mr-2">settings</v-icon> Manage Characters</v-btn>
                        </v-card-actions>
                    </v-card>
                </v-flex>
            </v-layout>
        </v-container>
    </v-content>
    <Toolbar />
    <LeftDrawer />
    <RouterView />
-->
</v-app>
</template>

<style lang="scss">
@import './sass/fonts.scss';
</style>
<script>
import axios from 'axios';
//import Main from './views/Main.vue';

//import Toolbar from './components/AppToolbar.vue';
//import LeftDrawer from './components/LeftDrawer.vue';

export default {
    name: 'App',

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
            this.$router.push('/eve-character-management');
        });
    }
}
</script>
