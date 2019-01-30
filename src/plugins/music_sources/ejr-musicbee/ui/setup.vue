<template>
<v-card>
    <v-card-text>
        <div>
            To use MusicBee, you  must first install the MusicBee Remote Plugin. For more information visit <a href="https://getmusicbee.com/forum/index.php?topic=7221.0">https://getmusicbee.com/forum/index.php?topic=7221.0</a>.
        </div>
        <v-form>
            <v-text-field
                v-model="mb_host"
                label="MusicBee Host / IP Address"/>
            <v-text-field
                v-model="mb_port"
                label="MusicBee Port Number"/>
        </v-form>
        <v-alert
            v-model="mb_error"
            color="error"
            icon="warning"
            outline>
            Unable to connect to MusicBee. Make sure MusicBee is running, double check the settings, and try again.
        </v-alert>
    </v-card-text>
    <v-card-actions>
        <v-progress-circular
        :size="25"
        indeterminate
        v-if="testing_mb"
        />
        <template v-else>
            <v-btn @click="test_musicbee">Next</v-btn>
        </template>
    </v-card-actions>
</v-card>
</template>

<script>

import axios from 'axios';

export default {
    data() {
        return {
            mb_host: 'localhost',
            mb_port: 3000,
            testing_mb: false,
            mb_error: false
        }
    },

    methods: {
        async test_musicbee() {
            this.testing_mb = true;
            this.mb_error = false;
            axios.post('/api/mp/musicbee/test', {
                client_host: this.mb_host,
                client_port: parseInt(this.mb_port)
            })
            .catch((err) => {
                this.testing_mb = false;
                this.mb_error = true;
                console.error(err);
            })
            .then(() => {
                if (!this.mb_error) {
                    return axios.post('/api/mp/musicbee/install', {
                        client_host: this.mb_host,
                        client_port: parseInt(this.mb_port)
                    });
                }
            })
            .then(() => {
                this.$emit('player-added');
            });
        }
    }
}
</script>
