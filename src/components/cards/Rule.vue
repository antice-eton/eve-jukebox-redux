<template>
<v-card>
    <v-card-title>Edit Rule</v-card-title>
    <v-card-text>
        <v-select label="Select Rule Type" :items="rule_types" v-model="selected_rule_type"/>

        <AutoComplete
            item-key="regions"
            item-text="name"
            item-value="region_id"
            url="/api/eve/regions"
            label="Type region name"
            v-model="selected_rule_criteria"
            :key="'region_select'"
            v-if="selected_rule_type === 'region'"/>

        <AutoComplete
            item-key="systems"
            item-text="name"
            item-value="system_id"
            url="/api/eve/systems"
            label="Type system name"
            v-model="selected_rule_criteria"
            :key="'system_select'"
            v-else-if="selected_rule_type === 'system'"/>

        <v-select
            :items="system_securities"
            label="Choose a System Security Level"
            v-model="selected_rule_criteria"
            :key="'system_sec_select'"
            v-else-if="selected_rule_type === 'system_security'"/>


    </v-card-text>
    <v-card-actions>
        <v-btn @click="save_rule">Save Rule</v-btn>
    </v-card-actions>
</v-card>
</template>

<script>

import AutoComplete from '../AutoComplete.vue';
import uuidv1 from 'uuid/v1';

const system_securities = [{
    text: 'High Security',
    value: 'high-sec'
},{
    text: 'Low Security',
    value: 'low-sec'
},{
    text: 'Null Security',
    value: 'null-sec'
}];

for (var i = -1.0; i <= 1.0; i = i + 0.1) {
    const ii = Math.round(i * 10) / 10;
    system_securities.push({
        text: ii,
        value: ii
    });
}

export default {

    components: {
        AutoComplete
    },

    watch: {
        selected_rule_type(newVal) {
            this.selected_rule_criteria = null;

            if (newVal) {
                this.selected_rule_name = this.rule_types.filter((rt) => rt.value === newVal).pop().text;
            }
        }
    },

    methods: {
        save_rule() {

            const rule = {
                type: this.selected_rule_type,
                name: this.selected_rule_name,
                criteria: this.selected_rule_criteria,
                id: uuidv1()
            };

            this.$emit('new-rule', rule);
        }
    },

    data() {
        return {
            selected_rule_type: '',
            selected_rule_name: '',
            selected_rule_criteria: null,
            rule_types: [{
                text: 'Region',
                value: 'region'
            },{
                text: 'System',
                value: 'system'
            },{
                text: 'System Security',
                value: 'system_security'
            }],
            system_securities
        }
    }
}

</script>
