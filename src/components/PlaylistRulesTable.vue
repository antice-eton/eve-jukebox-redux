<template>
<v-data-table
  :headers="headers"
  :items="value"
  class="elevation-1"
  hide-actions
  id="rules_table"
  >
    <template slot="items" slot-scope="props">
        <tr class="sortableRow" :key="props.item.id">
            <td>{{ props.item.name }}</td>
            <td v-if="props.item.type === 'system'">{{ props.item.criteria.name }}</td>
            <td v-else-if="props.item.type === 'region'">{{ props.item.criteria.name }}</td>
            <td v-else-if="props.item.type === 'system_security'">{{ props.item.criteria }}</td>
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
                text: 'Rule Type',
                align: 'left',
                sortable: false
            },{
                text: 'Rule Criteria',
                align: 'left',
                sortable: false
            }]
        }
    },

    methods: {
        reorder(newIndex, oldIndex) {
            const rows = this.value.slice(0);

            const selectedRow = rows.splice(oldIndex, 1)[0];
            rows.splice(newIndex, 0, selectedRow);

            this.$emit('input', rows);
        }
    },

    mounted() {
        let table = document.querySelector('#rules_table tbody');
        const _self = this;
    }
}
</script>
