<template>
<v-navigation-drawer
    :value="drawer"
    fixed
    clipped
    app
    stateless
    width="300"
    v-if="active_character_id"
>
    <v-card>
        <v-card-title primary-title>
            <v-flex xs3>
                <v-avatar>
                    <img :src="active_character_portrait">
                </v-avatar>
            </v-flex>
            <v-flex>
                <h4 class="text-uppercase font-weight-black">
                    {{ active_character_name }}
                </h4>
            </v-flex>
        </v-card-title>
        <v-card-text>
            <LeftEveData header="STATUS" :url="status_url" @new-data="onStatus">
                <template slot-scope="slotProps">
                    <template v-if="slotProps.api_data['online'] === true">
                        <span class="green--text">ONLINE</span>
                        <v-divider />
                    </template>
                    <template v-else>
                        <span class="red--text">OFFLINE</span>
                        <v-divider/>
                    </template>
                    <template v-if="slotProps.error">
                        <span>
                            <v-icon>error_outline</v-icon>
                            Unable to get online status.
                        </span>
                    </template>
                </template>
            </LeftEveData>
            <LeftEveData header="LOCATION" :url="location_url" v-if="online">
                <template slot-scope="slotProps">
                    <v-layout row wrap v-if="slotProps.error === false && slotProps.api_data['system']" class="caption">
                        <v-flex xs4>
                            SYSTEM:
                        </v-flex>
                        <v-flex xs8>
                            {{ slotProps.api_data.system.name }}
                        </v-flex>
                        <v-flex xs4>
                            SECURITY:
                        </v-flex>
                        <v-flex xs8>
                            {{ slotProps.api_data.system.security_status }} ({{ slotProps.api_data.system.security_class }})
                        </v-flex>
                        <v-flex xs4>
                            REGION:
                        </v-flex>
                        <v-flex xs8>
                            {{ slotProps.api_data.region.name }}
                        </v-flex>
                        <v-flex xs4>
                            SOVEREIGNTY:
                        </v-flex>
                        <v-flex xs8>
                            <template v-if="slotProps.api_data['faction']">
                                {{ slotProps.api_data['faction']['name'] }}
                            </template>
                        </v-flex>
                        <v-flex xs4>
                            STATION:
                        </v-flex>
                        <v-flex xs8 v-if="slotProps.api_data['station']">
                            {{ slotProps.api_data['station']['name'] }}
                        </v-flex>
                        <v-flex xs8 v-else>
                            Undocked
                        </v-flex>
                    </v-layout>
                    <v-divider/>
                    <span v-if="slotProps.error" class="red--text text--darken-4 font-weight-medium"><v-icon color="error" small>error_outline</v-icon> Unable to get location</span>
                </template>
            </LeftEveData>
        </v-card-text>
    </v-card>
</v-navigation-drawer>
</template>

<script>

import LeftEveData from './LeftEveData';
import axios from 'axios';

export default {

    components: {
        LeftEveData
    },

    data() {
        return {
            online: false
        }
    },

    computed: {
        drawer() {
            return (!this.$store.state.active_character_id) === false;
        },

        active_character_id() {
            return this.$store.state.active_character_id;
        },

        active_character_name() {
            return this.$store.state.active_character_name;
        },

        active_character_portrait() {
            return '/portraits/' + this.active_character_id + '_512.jpg';
        },

        status_url() {
            return '/api/eve/eve_characters/' + this.active_character_id + '/status';
        },

        location_url() {
            return '/api/eve/eve_characters/' + this.active_character_id + '/location';
        }
    },

    methods: {
        onStatus(status) {
            if (status.online === true) {
                this.online = true;
            } else {
                this.online = false;
            }
        }
    }

}
</script>
