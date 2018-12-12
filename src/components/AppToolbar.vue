<template>
<v-toolbar dense fixed clipped-left app transition="fade-transition">
    <v-toolbar-title class="mr-5 align-center">
        <span class="title">
            EVE Jukebox Redux
        </span>
    </v-toolbar-title>
    <v-spacer />
    <v-menu left>
        <v-btn flat slot="activator" small>
            MENU
            <v-icon>keyboard_arrow_down</v-icon>
        </v-btn>
        <v-list>
            <v-subheader v-if="characters.length > 0">
                Choose Character
            </v-subheader>
            <v-list-tile @click="activateCharacter(char)" v-for="char in characters">
                <v-avatar size="25" class="mr-2">
                    <img :src="'/portraits/' + char.character_id + '_512.jpg'">
                </v-avatar>
                <v-list-tile-title>{{ char.character_name }}</v-list-tile-title>
            </v-list-tile>
            <v-divider v-if="characters.length > 0" />
            <v-list-tile @click="$router.push('/login')">
                <v-icon class="mr-2">account_circle</v-icon>
                <v-list-tile-title>Manage Characters</v-list-tile-title>
            </v-list-tile>
            <v-list-tile @click="$router.push('/settings')">
                <v-icon class="mr-2">settings</v-icon>
                <v-list-tile-title>Settings</v-list-tile-title>
            </v-list-tile>
            <v-list-tile @click="logout" v-if="active_character_id">
                <v-icon class="mr-2">logout</v-icon>
                <v-list-tile-title>Logout</v-list-tile-title>
            </v-list-tile>
        </v-list>
    </v-menu>

    <!--
    <v-avatar class="mx-2">
        <img :src="active_character_portrait" :alt="active_character_name" :title="active_character_name"/>
    </v-avatar>
    -->
</v-toolbar>
</template>

<script>

import axios from 'axios';

export default {
    data() {
        return {
            loading: false
        }
    },

    computed: {
        characters() {
            return this.$store.state.characters;
        },

        active_character_id() {
            return this.$store.state.active_character_id;
        },

        active_character_name() {
            return this.$store.state.active_character_name;
        },

        active_character_portrait() {
            return '/portraits/' + this.active_character_id + '_512.jpg';
        }
    },

    methods: {
        activateCharacter(char) {
            axios.post('/api/active_character', {
                character_id: char.character_id
            })
            .then(() => {
                this.$store.commit('ACTIVATE_CHARACTER', char);
                this.$router.push('/');
            });
        },

        logout() {
            axios.delete('/api/active_character')
            .then(() => {
                this.$store.commit('RESET_ACTIVATION');
                this.$router.push('/login');
            });
        }
    }
}
</script>
