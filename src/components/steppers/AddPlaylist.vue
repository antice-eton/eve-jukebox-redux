<template>
<v-stepper v-model="add_playlist_step">
    <v-stepper-header>
        <v-stepper-step
            :complete="add_playlist_step > 1"
            :step="1"
            >
            Choose Criteria
        </v-stepper-step>
        <v-divider />
        <v-stepper-step
            :complete="add_playlist_step > 2"
            :step="2"
            >
            Configure
        </v-stepper-step>
        <v-divider />
        <v-stepper-step
            :complete="add_playlist_step > 3"
            :step="3"
            >
            Choose Playlist
        </v-stepper-step>
    </v-stepper-header>
    <v-stepper-items>
        <v-stepper-content step="1">
            <CriteriaSelectionStep @cancel="$emit('cancel')" @next="selectCriteria"/>
        </v-stepper-content>
        <v-stepper-content step="2">
            <SecurityCriteriaStep v-if="criteria_type === 'system_security'" @cancel="cancel" @next="chosenCriteria"/>
            <RegionCriteriaStep v-else-if="criteria_type === 'region'" @cancel="cancel" @next="chosenCriteria"/>
            <template v-else>
                <p>Not supported yet</p>
            </template>
        </v-stepper-content>

        <v-stepper-content step="3">
            <PlaylistSelector @cancel="cancel" @next="savePlaylistCriteria"/>
        </v-stepper-content>
    </v-stepper-items>
</v-stepper>
</template>

<script>

import axios from 'axios';

import CriteriaSelectionStep from './steps/CriteriaSelection.vue';
import RegionCriteriaStep from './steps/RegionCriteria.vue';
import SecurityCriteriaStep from './steps/SecurityCriteria.vue';
import PlaylistSelector from './steps/PlaylistSelector.vue';

export default {
    props: ['value'],

    components: {
        CriteriaSelectionStep,
        RegionCriteriaStep,
        SecurityCriteriaStep,
        PlaylistSelector
    },

    data() {
        return {
            add_playlist_step: 1,
            criteria_type: '',
            criteria: null
        }
    },

    computed: {
        musicsource_id() {
            return this.$store.state.active_musicsource.id;
        },

        musicsource_name() {
            return this.$store.state.active_musicsource.name;
        },


    },

    methods: {

        cancel(success) {
            this.add_playlist_step = 1;
            this.criteria_type = null;
            this.criteria = null;
            this.$emit('cancel', success);
        },

        selectCriteria(criteriaType) {
            console.log('Criteria chosen:', criteriaType);

            this.criteria_type = criteriaType;
            this.add_playlist_step = 2;
        },

        chosenCriteria(args) {
            this.criteria = args;
            this.add_playlist_step = 3;
        },

        savePlaylistCriteria(playlist) {

            const data = {};

            data[this.criteria_type] = this.criteria;
            data['playlist'] = playlist;

            axios.post('/api/music_sources/linked/' + this.musicsource_id + '/playlistCriteria', data)
            .then((res) => {
                this.cancel(true);
            });
        }
    }
}
</script>
