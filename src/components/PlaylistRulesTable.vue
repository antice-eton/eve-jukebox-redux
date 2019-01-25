<template>
<v-data-table
  :headers="headers"
  :items="value"
  class="elevation-1"
  :loading="loading"
  hide-actions
  id="playlists_table"
  >
    <template slot="items" slot-scope="props">
        <tr class="sortableRow" :key="props.item.id">
            <td class="drag-handle">
                <v-icon>reorder</v-icon>
            </td>
            <td>{{ props.item.display_name }}</td>
            <CriteriaColumn :criteria="props.item.criteria"/>
            <td class="text-xs-center" v-if="deleting_rule !== props.item.id">
                <v-btn small icon ripple @click="edit_rule(props.item)">
                    <v-icon small>edit</v-icon>
                </v-btn>
                <v-btn small icon ripple @click="delete_rule(props.item)">
                    <v-icon small>delete</v-icon>
                </v-btn>
            </td>
            <td class="text-xs-center" v-else>
                <v-progress-circular indeterminate size="16" width="2"/>
            </td>
        </tr>
    </template>
</v-data-table>
</template>

<script>

import Sortable from 'sortablejs';
import CriteriaColumn from './table_columns/CriteriaColumn.vue';


export default {

    props: ['value','loading','deleting_rule'],

    components: {
        CriteriaColumn
    },

    data() {
        return {
            headers: [{
                text: '',
                sortable: false
            },{
                text: 'Playlist Name',
                align: 'left',
                sortable: false
            },{
                text: 'Criteria',
                align: 'left',
                sortable: false
            },{
                text: 'Actions',
                sortable: false,
                align: 'center'
            }],
        }
    },

    methods: {
        reorder(newIndex, oldIndex) {
            this.$emit('reorder', { to: newIndex, from: oldIndex });
        },

        edit_rule(rule) {
            this.$emit('edit-rule', rule);
        },

        delete_rule(rule) {
            this.$emit('delete-rule', rule);
        }
    },

    mounted() {
        let table = document.querySelector('#playlists_table tbody');
        const _self = this;
        Sortable.create(table, {
            draggable: 'tr',
            handle: '.drag-handle',
            onEnd: (evt) => {
                console.log('on end:', evt);
                this.reorder(evt.newIndex, evt.oldIndex);
            }
        });
    }
}
</script>
