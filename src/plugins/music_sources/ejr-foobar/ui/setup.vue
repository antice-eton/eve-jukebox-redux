<template>
<v-card>
    <v-card-title>
        Foobar2000
    </v-card-title>
    <v-card-text>
        <div>
            In order to control Foobar using Eve Jukebox Redux, you have to install the <a href="http://www.foobar2000.org/components/view/foo_beefweb" _target="foobar">Beefweb Remote Control</a> component.
        </div>
        <v-form>
            <v-text-field
                v-model="foobar_url"
                label="Foobar URL"/>
            <v-divider/>
            <v-text-field
                v-model="foobar_username"
                label="Foobar Username (optional)"/>
            <v-text-field
                type="password"
                v-model="foobar_password"
                label="Foobar Password (optional)"/>
        </v-form>
        <v-alert
            v-model="foobar_error"
            color="error"
            icon="warning"
            outline>
            Unable to connect to Foobar. Make sure Foobar is running, double check the settings, and try again.
        </v-alert>


    </v-card-text>
    <v-card-actions>
        <v-progress-circular
        :size="25"
        indeterminate
        v-if="testing_foobar"
        />
        <template v-else>
            <v-btn @click="testFoobar">Next</v-btn>
        </template>
    </v-card-actions>
</v-card>
</template>

<script>

import axios from 'axios';

export default {
    data() {
        return {
            foobar_url: 'http://localhost:8880',
            foobar_username: '',
            foobar_password: '',
            testing_foobar: false,
            foobar_error: false
        }
    },

    methods: {
        testFoobar() {
            this.testing_foobar = true;
            this.foobar_error = false;
            axios.post('/api/mp/foobar/test', {
                foobar_url: this.foobar_url,
                foobar_username: this.foobar_username,
                foobar_password: this.foobar_password
            })
            .catch((err) => {
                this.testing_foobar = false;
                this.foobar_error = true;
                console.error(err);
            })
            .then(() => {
                if (!this.foobar_error) {
                    return axios.post('/api/mp/foobar/install', {
                        foobar_url: this.foobar_url,
                        foobar_username: this.foobar_username,
                        foobar_password: this.foobar_password
                    })
                    .then(() => {
                        this.testing_foobar = false;
                        this.foobar_url = null;
                        this.foobar_username = null;
                        this.foobar_password = null;

                        this.$emit('player-added');
                    });
                }
            });
        }
    }
}
</script>
