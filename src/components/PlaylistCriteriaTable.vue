<template>
<v-data-table
  :headers="headers"
  :items="value"
  class="elevation-2"
  hide-actions
  id="rules_table"
  >
    <template slot="items" slot-scope="props">
        <tr class="sortableRow" :key="props.item.id">
            <td>{{ props.item.name }}</td>

            <td v-if="props.item.type === 'system_security'">{{ system_security_label(props.item.criteria) }}</td>
            <td v-else-if="props.item.type === 'docked'">Docked at Station / Structure</td>
            <td v-else> {{ props.item.criteria.name }} </td>

            <td class="text-xs-center"><v-icon small @click="delete_criteria(props.item)" >delete</v-icon></td>

        </tr>
    </template>
</v-data-table>
</template>

<script>

import Sortable from 'sortablejs';

export default {

    props: ['value'],

    data() {
        return {
            headers: [{
                text: 'Type',
                align: 'left',
                sortable: false
            },{
                text: 'Criteria',
                align: 'left',
                sortable: false
            },{
                text: 'Actions',
                align: 'center',
                sortable: false
            }]
        }
    },

    methods: {
        delete_criteria(criteria) {

            let found = false;
            let idx = 0;

            for (; idx < this.value.length; idx++) {
                if (this.value[idx].id === criteria.id) {
                    found = true;
                    break;
                }
            }

            if (found === true) {
                console.log('deleting criteria at idx:', idx, criteria, this.value[idx]);

                if (idx === 0 && this.value.length === 1) {
                    this.$emit('input', []);
                } else {
                    var new_criteria = this.value.slice();
                    new_criteria.splice(idx, 1)
                    this.$emit('input', new_criteria);
                }
            }
        },

        system_security_label(val) {
            if (val === 'high-sec') {
                return 'High Sec';
            } else if (val === 'low-sec') {
                return 'Low Sec';
            } else if (val === 'null-sec') {
                return 'Null Sec';
            } else {
                return val;
            }
        }
    },

    mounted() {
        let table = document.querySelector('#rules_table tbody');
        const _self = this;
    }
}
</script>
