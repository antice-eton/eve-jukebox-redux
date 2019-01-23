<template>
<v-card raised dark>
    <v-card-title class="grey darken-4">
        <v-toolbar flat>
            <v-toolbar-title>Playlist Rules</v-toolbar-title>
            <v-spacer/>
            <v-btn color="primary" @click="add_playlist_rules">
                Add Playlist Rules
            </v-btn>
        </v-toolbar>
    </v-card-title>
    <v-card-text>
        <PlaylistsTable v-model="playlists" />
    </v-card-text>

    <v-dialog v-model="add_rule_dialog" lazy max-width="1024">
        <PlaylistRulesStepper />
    </v-dialog>

    <v-dialog v-model="edit_rule_dialog" max-width="1024">
        <PlaylistRulesCard @new-rule="new_rule" ref="rule-card"/>
    </v-dialog>

</v-card>
</template>
<style>
.handle {
    cursor: default !important;
}
</style>
<script>

import draggable from 'vuedraggable';
import axios from 'axios';

import PlaylistsTable from '../PlaylistsTable.vue';
import PlaylistRulesCard from './PlaylistRulesCard.vue';
import PlaylistRulesStepper from '../steppers/PlaylistRules.vue';

export default {
    components: {
        draggable,
        PlaylistsTable,
        PlaylistRulesCard,
        PlaylistRulesStepper
    },

    data() {
        return {
            add_rule_dialog: false,
            edit_rule_dialog: false,
            playlists: [],
            player_name: null,
            loading: false
        }
    },

    methods: {
        add_rule() {
            this.add_rule_dialog = true;
        },

        new_rule() {

        },

        add_playlist_rules() {
            this.add_rule_dialog = true;
        },

        async reload() {
            this.loading = true;

            const res = await axios.get('/api/playlists');

            this.playlists = res.data.playlists;

            this.loading = false;
        }
    }
}

</script>
