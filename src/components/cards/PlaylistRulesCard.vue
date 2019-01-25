<template>
<v-card raised dark>
    <v-card-title class="grey darken-4">
        <v-toolbar flat>
            <v-toolbar-title>Playlist Rules</v-toolbar-title>
            <v-spacer/>
            <v-btn color="blue-grey darken-2" @click="add_playlist_rules">
                Add New Playlist Rule
            </v-btn>
        </v-toolbar>
    </v-card-title>
    <v-card-text>
        <PlaylistRulesTable v-model="playlist_rules" @reorder="reorder_rules" @edit-rule="edit_rule" @delete-rule="delete_rule" :loading="loading" :deleting_rule="deleting_rule"/>
    </v-card-text>

    <v-card-actions v-if="dialog">
        <span v-if="saving"><v-progress-circular indeterminate size="16" width="2" class="mx-2"/> Saving... </span>
        <v-spacer/>
        <v-btn @click="$emit('close')" class="text-xs-right">Close</v-btn>
    </v-card-actions>

    <v-dialog v-model="add_rule_dialog" max-width="1024">
        <PlaylistRuleStepper @cancel="on_editor_close" v-if="add_rule_dialog"/>
    </v-dialog>

    <v-dialog v-model="edit_rule_dialog" max-width="1024">
        <PlaylistRuleEditorCard v-if="edit_rule_dialog" :rule="editing_rule" @close="on_editor_close"/>
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

import PlaylistRulesTable from '../PlaylistRulesTable.vue';
import PlaylistRuleEditorCard from './PlaylistRuleEditorCard.vue';
import PlaylistRuleStepper from '../steppers/PlaylistRuleStepper.vue';

export default {
    props: {
        dialog: Boolean
    },

    components: {
        draggable,
        PlaylistRulesTable,
        PlaylistRuleEditorCard,
        PlaylistRuleStepper
    },

    data() {
        return {
            add_rule_dialog: false,
            edit_rule_dialog: false,
            editing_rule: null,
            playlist_rules: [],
            player_name: null,
            loading: false,
            saving: false,
            deleting_rule: null
        }
    },

    methods: {
        on_editor_close(rule) {
            if (rule) {
                this.reload();
            }
            this.edit_rule_dialog = false;
            this.add_rule_dialog = false;
        },

        edit_rule(rule) {
            this.editing_rule = rule;

            this.edit_rule_dialog = true;
        },

        async reorder_rules(change) {

            console.log('reordering:', change);

            const oldIndex = change.from;
            const newIndex = change.to;
            this.loading = true;
            this.saving = true;

            const selectedRow = this.playlist_rules.splice(oldIndex, 1)[0];
            this.playlist_rules.splice(newIndex, 0, selectedRow);

            const priorities = this.playlist_rules.map((rule) => rule.id);

            await axios.put('/api/playlist_rules', {
                priorities: priorities
            });

            this.loading = false;
            this.saving = false;
        },

        add_playlist_rules() {
            this.add_rule_dialog = true;
        },

        async delete_rule(rule) {
            this.deleting_rule = rule.id;
            await axios.delete('api/playlist_rules/' + rule.id);
            await this.reload();
            this.deleting_rule = null;

        },

        async reload() {
            this.loading = true;

            const res = await axios.get('/api/playlist_rules');

            this.playlist_rules = res.data.playlist_rules;

            this.loading = false;
        }
    },

    mounted() {
        this.reload();
    }
}

</script>
