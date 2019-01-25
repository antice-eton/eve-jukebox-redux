<template>
<v-card>
    <v-card-title>
        <v-toolbar flat>
            Criteria for {{ playlist_name }}
            <v-spacer />
            <v-btn color="primary" @click="add_criteria">Add Criteria</v-btn>
        </v-toolbar>
    </v-card-title>
    <v-card-text>
        <PlaylistCriteriaTable v-model="criteria" />
    </v-card-text>
    <v-card-actions>
        <v-spacer/>
        <v-progress-circular v-if="saving" indeterminate size="16" width="2" class="mx-2"/>
        <v-btn @click="$emit('close')" v-if="saving !== true">Close</v-btn>
        <v-btn @click="save_rule" :disabled="saving" color="blue-grey darken-4">Save <v-icon right>save</v-icon></v-btn>

    </v-card-actions>

    <v-dialog v-model="add_criteria_dialog" max-width="500">
        <CriteriaSelectorCard @close="new_criteria" v-if="add_criteria_dialog"/>
    </v-dialog>

</v-card>
</template>

<script>

import PlaylistCriteriaTable from '../PlaylistCriteriaTable.vue';
import CriteriaSelectorCard from './CriteriaSelectorCard.vue';
import axios from 'axios';

export default {

    props: {
        'playlist': {
            default: () => {
                return {
                    name: ''
                }
            }
        },
        'rule': {
            default: null
        }
    },

    components: {
        PlaylistCriteriaTable,
        CriteriaSelectorCard
    },

    computed: {
        playlist_name() {
            if (this.playlist) {
                return this.playlist.name;
            } else {
                return 'ERROR - No playlist selected, how did you get here?';
            }
        }
    },

    watch: {
        rule(newVal) {
            if (newVal) {
                this.criteria = newVal.criteria;
            } else {
                this.criteria = [];
            }
        }
    },

    data() {
        return {
            criteria: [],
            add_criteria_dialog: false,
            saving: false
        }
    },

    methods: {
        add_criteria() {
            this.add_criteria_dialog = true;
        },

        new_criteria(rule) {
            if (rule) {
                this.criteria.push(rule);
            }
            this.add_criteria_dialog = false;
        },

        async save_rule() {

            this.saving = true;

            const playlist_rule = {};

            let res;

            if (!this.rule) {
                playlist_rule['player_id'] = this.playlist.player_id;
                playlist_rule['player_playlist_id'] = this.playlist.id;
                playlist_rule['display_name'] = this.playlist.name;
                playlist_rule['criteria'] = this.criteria;

                const res = await axios.post('/api/playlist_rules', playlist_rule);

                this.$emit('close', res.data);
                this.saving = false;
            } else {
                const new_rule = Object.assign({}, this.rule);
                new_rule['criteria'] = this.criteria;

                const res = await axios.put('/api/playlist_rules/' + new_rule.id, new_rule);
                this.$emit('close', res.data);
                this.saving = false;
            }
        }
    },

    mounted() {
        if (this.rule) {
            this.criteria = this.rule.criteria;
        }
    }
};

</script>
