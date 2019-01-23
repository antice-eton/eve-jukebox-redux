<template>
<v-card>
    <v-card-title>
        <v-toolbar flat>
            Rules for {{ playlist.name }}
            <v-spacer />
            <v-btn color="primary" @click="add_rule">Add Rule</v-btn>
        </v-toolbar>
    </v-card-title>
    <v-card-text>
        <PlaylistRulesTable v-model="rules" />
    </v-card-text>

    <v-dialog v-model="add_rule_dialog">
        <RuleCard @new-rule="new_rule"/>
    </v-dialog>

</v-card>
</template>

<script>

import PlaylistRulesTable from '../PlaylistRulesTable.vue';
import RuleCard from './Rule.vue';

export default {

    props: ['playlist'],

    components: {
        PlaylistRulesTable,
        RuleCard
    },

    data() {
        return {
            rules: [],
            add_rule_dialog: false
        }
    },

    methods: {
        add_rule() {
            this.add_rule_dialog = true;
        },

        new_rule(rule) {
            this.rules.push(rule);
            this.add_rule_dialog = false;
        }
    }
};

</script>
