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
                v-model="foobar_user"
                label="Foobar Username (optional)"/>
            <v-text-field
                v-model="foobar_pass"
                label="Foobar Password (optional)"/>
        </v-form>


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
            foobar_url: 'http://localhost:8880'
            testing_foobar: false
        }
    },

    methods: {
        testFoobar() {
            axios.post('/api/music_sources/')
            axios.get('http://localhost:8880/api/playlists');
        }
    }
}
</script>
