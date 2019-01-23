<template>
<v-app id="ejr" dark>
    <transition name="slide-fade">
        <v-content v-if="loading" key="loading_screen">
            <v-container fluid>
                <v-layout justify-center>
                    <v-flex xs12 sm8 md4>
                        <v-card class="elevation-13">
                            <v-card-title class="elevation-3">
                                Loading ...
                            </v-card-title>
                            <v-card-text>
                                <v-progress-circular indeterminate x-large v-if="loading"/>
                                <template v-else-if="loading_error">
                                    <h4 class="red--text text--darken-4">ERROR</h4>
                                    <div class="red--text">{{ loading_error_msg }} {{ retry_count }}</div>
                                    <div>Retrying in {{ retry_count }} second(s).</div>
                                </template>
                            </v-card-text>
                        </v-card>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>
        <v-content v-else-if="active_character_id === null" key="characters">
            <v-container fluid>
                <v-layout justify-center>
                    <v-flex xs12 sm8 md6>
                        <EveCharactersCard @cancel="refreshStatus"/>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>
        <v-content v-else key="character">
            <v-container fluid>
                <v-layout wrap>
                    <v-flex xs12>
                        <h1 class="mb-1 display-1">EVE Jukebox Redux</h1>
                    </v-flex>
                    <v-flex xs12>
                        <EveCharacterCard/>
                    </v-flex>
                    <!--
                    <v-flex xs12 class="mt-4">
                        <MusicCard/>
                    </v-flex>
                    -->
                </v-layout>
            </v-container>
        </v-content>
    </transition>
    <!--
    <transition name="fade">
        <router-view v-if="loading === false"/>
    </transition>
-->
</v-app>
</template>

<style lang="scss">
@import './sass/fonts.scss';
/* Enter and leave animations can use different */
/* durations and timing functions.              */
.slide-fade-enter-active {
  transition: all .3s ease;
}
.slide-fade-leave-active {
  transition: all .8s cubic-bezier(1.0, 0.5, 0.8, 1.0);
}
.slide-fade-enter, .slide-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateX(10px);
  opacity: 0;
}
</style>
<script>
import axios from 'axios';
import EveCharactersCard from './components/cards/EveCharacters.vue';
import EveCharacterCard from './components/cards/EveCharacter.vue';
// import MusicCard from './components/cards/MusicSource.vue';
//import Main from './views/Main.vue';

//import Toolbar from './components/AppToolbar.vue';
//import LeftDrawer from './components/LeftDrawer.vue';

export default {
    name: 'App',

    components: {
        EveCharactersCard,
        EveCharacterCard
    },

    data() {
        return {
            loading_status: true,
            loading: true,
            no_active_characters: false,
            loading_error: false,
            loading_error_msg: '',
            retry_timer: null,
            retry_count: 5,
            reload: false
        }
    },

    computed: {
        active_character_id() {
            return this.$store.state.active_character_id;
        },

        ws_reconnecting() {
            return this.$store.state.socket_reconnecting;
        }
    },

    watch: {
        ws_reconnecting(newVal) {
            if (newVal === true) {
                this.reload = true;
            } else if (newVal === false && this.reload === true) {
                this.refreshStatus();
                this.reload = false;
            }
        },

        active_character_id(char) {
            if (char) {
                //his.$connect();
                this.no_active_characters = false;
            } else {
                //this.$disconnect();
                this.no_active_characters = true;
            }
        }
    },

    methods: {

        async refreshTicker() {
            this.retry_count--;

            if (this.retry_count <= 0 && this.loading !== true ) {
                this.retry_count = 5;
                await this.refreshStatus();
            } else {
                if (this.loading === true) {
                    return;
                }
                this.retry_count--;
                setTimeout(async () => {
                    await this.refreshTicker();
                }, 1000);
            }
        },

        async refreshStatus() {
            this.loading = true;

            return axios.get('/api/session/status')
            .then((res) => {
                const session = res.data;
                this.$store.commit('ACTIVATE_CHARACTER_ID', session.active_character_id);
                this.$store.commit('ACTIVATE_MUSICPLAYER_ID', session.active_musicplayer_id);
                this.loading = false;
            });
            /*



            return axios.get('/api/session/status')
            .then(() => {

                return axios.get('/api/eve/active_character');
            })
            .then((res) => {
                const char = res.data;

                this.$store.dispatch('activate_character', char.character_id);

                // this.$store.commit('ACTIVATE_CHARACTER', char);
                this.loading = false;
                this.loading_status = false;
                this.loading_error = false;
                this.loading_error_msg = '';
                this.no_active_characters = false;
            })
            .catch((err) => {
                console.error(err.response);
                if (err['response'] && err['response'].status === 403) {
                    this.no_active_characters = true;
                    this.loading_status = false;
                    this.loading = false;
                    this.loading_error = false;
                    this.loading_error_msg = '';
                } else {
                    this.loading = false;
                    this.no_active_characters = true;
                    this.loading_error = true;
                    this.loading_error_msg = 'There was a problem trying to communicate with the server.';
                    this.refreshTicker();
                }
            });

            */
        }
    },

    beforeDestroy() {
        //this.$disconnect();
    },

    mounted() {
        //this.$connect();
        this.refreshStatus();
    }
}
</script>
