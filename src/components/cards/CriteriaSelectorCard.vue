<template>
<v-card>
    <v-card-title>Edit Criteria</v-card-title>
    <v-card-text>
        <v-select label="Criteria Type" :items="criteria_types" v-model="criteria_type"/>

        <AutoComplete
            item-key="regions"
            item-text="name"
            item-value="region_id"
            url="/api/eve/regions"
            label="Type region name"
            v-model="criteria"
            :key="'region_select'"
            v-if="criteria_type === 'region'"/>

        <AutoComplete
            item-key="systems"
            item-text="name"
            item-value="system_id"
            url="/api/eve/systems"
            label="Type system name"
            v-model="criteria"
            :key="'system_select'"
            v-else-if="criteria_type === 'system'"/>

        <v-select
            :items="system_securities"
            label="Choose a System Security Level"
            v-model="criteria"
            :key="'system_sec_select'"
            v-else-if="criteria_type === 'system_security'"/>

        <StationCriteria v-model="criteria" v-else-if="criteria_type === 'station'"/>

    </v-card-text>
    <v-card-actions>
        <v-spacer/>
        <v-btn @click="$emit('close')">Cancel</v-btn> <v-btn color="blue-grey darken-4" @click="save_criteria">Save Criteria</v-btn>
    </v-card-actions>
</v-card>
</template>

<script>

import AutoComplete from '../AutoComplete.vue';
import uuidv1 from 'uuid/v1';

import StationCriteria from './criteria/Station.vue';

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
        AutoComplete,
        StationCriteria
    },

    watch: {
        criteria_type(newVal) {

            if (newVal === 'docked') {
                this.criteria = { name: 'Docked' };
                this.criteria_name = 'Docked';
                this.criteria
            } else if (newVal) {
                this.criteria_name = this.criteria_types.filter((rt) => rt.value === newVal).pop().text;
            }
        }
    },

    methods: {
        save_criteria() {

            const criteria = {
                type: this.criteria_type,
                name: this.criteria_name,
                criteria: this.criteria,
                id: uuidv1()
            };

            this.$emit('close', criteria);
        }
    },

    data() {
        return {
            criteria_type: '',
            criteria_name: '',
            criteria: null,
            criteria_types: [{
                text: 'Region',
                value: 'region'
            },{
                text: 'System',
                value: 'system'
            },{
                text: 'System Security',
                value: 'system_security'
            },{
                text: 'Station',
                value: 'station'
            },{
                text: 'Docked at Station/Structure',
                value: 'docked'
            }],
            system_securities
        }
    }
}

</script>
