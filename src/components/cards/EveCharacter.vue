<template>
<v-card raised dark>
    <v-card-title class="grey darken-4">Character</v-card-title>
    <v-card-text>
        <v-layout wrap>
            <v-flex xs6>
                <v-layout wrap>
                    <v-flex xs3>
                        <v-avatar size="100">
                            <img :src="character_portrait">
                        </v-avatar>
                    </v-flex>
                    <v-flex class="ml-3">
                        <h4 class="text-uppercase font-weight-black text--darken-2">
                            Character
                        </h4>
                        <p>
                            {{ character_name }}
                        </p>

                        <h4 class="text-uppercase font-weight-black">
                            Status
                        </h4>
                        <p v-if="loading_online">
                            <v-progress-circular size="16" indeterminate/> LOADING
                        </p>
                        <p v-else-if="online === true">
                            <v-icon small>power</v-icon> ONLINE
                        </p>
                        <p v-else>
                            <v-icon small>power_off</v-icon> OFFLINE
                        </p>
                    </v-flex>
                </v-layout>
            </v-flex>
            <v-flex xs6>
                <h4 class="text-uppercase font-weight-black text--darken-2">
                    Location <v-progress-circular size="16" indeterminate v-if="loading_location"/>
                </h4>
                <v-layout wrap v-if="loading_location === false">
                    <v-flex xs3>
                        <v-icon small>flare</v-icon> System:
                    </v-flex>
                    <v-flex xs9>
                        {{ location.system.name }} {{ location.system.security_status }}
                    </v-flex>
                    <v-flex xs3>
                        <v-icon small>bubble_chart</v-icon> Region:
                    </v-flex>
                    <v-flex xs9>
                        <span v-if="location.region">
                            {{ location.region.name }}
                        </span>
                    </v-flex>
                    <v-flex xs3>
                        <v-icon small>save_alt</v-icon> Docked:
                    </v-flex>
                    <v-flex xs9>
                        {{ (location.docked)? 'Yes' : 'No' }}
                    </v-flex>
                    <template v-if="location['station']">
                        <v-flex xs3>
                            <v-icon small>domain</v-icon> Station:
                        </v-flex>
                        <v-flex xs9>
                            {{ location.station.name }}
                        </v-flex>
                    </template>

                </v-layout>
            </v-flex>
        </v-layout>
    </v-card-text>
    <v-card-actions class="grey darken-4">
        <v-btn @click="manage_characters = true"><v-icon class="mr-2">settings</v-icon> Manage Characters</v-btn>
    </v-card-actions>
    <v-dialog v-model="manage_characters" max-width="500">
        <EveCharactersCard @active-character="manage_characters = false"/>
    </v-dialog>
</v-card>
</template>

<script>

import EveCharactersCard from './EveCharacters.vue';
import _ from 'lodash';

export default {

    components: {
        EveCharactersCard
    },

    data() {
        return {
            manage_characters: false
        }
    },

    computed: {
        character_id() {
            return this.$store.state.active_character_id;
        },

        character_name() {
            return this.$store.state.active_character_name;
        },

        character_portrait() {
            return '/portraits/' + this.character_id + '_512.jpg';
        },

        online() {
            return this.$store.state.online;
        },

        location() {
            return this.$store.state.location;
        },

        loading_online() {
            return (this.$store.state.loading_online || this.$store.state.socket_connected === false);
        },

        loading_location() {
            return (this.$store.state.loading_location || this.$store.state.socket_connected === false);
        }
    }
}
</script>
