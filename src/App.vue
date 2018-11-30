<template>
<v-app id="esc" dark>
    <v-navigation-drawer
        v-model="drawer"
        clipped
        fixed
        app>
        <v-list dense>
            <v-list-tile @click="$router.push({name:'spotify'})">
                <v-list-tile-avatar>
                    <img :src="spotify_icon" class="spotify-icon">
                </v-list-tile-avatar>
                <v-list-tile-content>
                    <v-list-tile-title>Spotify</v-list-tile-title>
                    <v-list-tile-sub-title>
                        Configure your Spotify account
                    </v-list-tile-sub-title>
                </v-list-tile-content>
            </v-list-tile>

            <v-list-tile @click="$router.push({name:'eve'})">
                <v-list-tile-avatar>
                    <img :src="eve_icon" class="eve-icon">
                </v-list-tile-avatar>
                <v-list-tile-content>
                    <v-list-tile-title>Eve Online</v-list-tile-title>
                    <v-list-tile-sub-title>
                        Configure your EVE Online Account
                    </v-list-tile-sub-title>
                </v-list-tile-content>
            </v-list-tile>
        </v-list>
    </v-navigation-drawer>

    <v-toolbar app fixed clipped-left>
        <v-toolbar-title>Eve Spotify Controller</v-toolbar-title>
        <v-spacer/>
        <v-toolbar-items>
            <v-btn flat>About</v-btn>
            <v-btn flat>Github</v-btn>
        </v-toolbar-items>
    </v-toolbar>

    <v-content>
        <v-container fluid grid-list-md>
            <router-view></router-view>
        </v-container>
    </v-content>

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

export default {
    name: 'App',
    data () {
        return {
            drawer: true
        }
    },

    computed: {
        spotify_icon() {
            return require('./assets/spotify-enabled.svg');
        },

        eve_icon() {
            return require('./assets/eve-logo.png');
        }
    },
}
</script>
