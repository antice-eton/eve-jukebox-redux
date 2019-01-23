<template>
<v-data-table
  :headers="headers"
  :items="value"
  class="elevation-1"
  hide-actions
  id="playlists_table"
  >
    <template slot="items" slot-scope="props">
        <tr class="sortableRow" :key="props.item.id">
            <td style="max-width: 28px" class="drag-handle">
                <v-tooltip top>
                    <v-icon>sort</v-icon>
                    <span>Sort Priority</span>
                </v-tooltip>
            </td>
            <td>{{ props.item.display_name }}</td>
            <td>{{ props.item.rules }}</td>
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
                text: '',
                sortable: false
            },{
                text: 'Playlist Name',
                align: 'left',
                sortable: false
            },{
                text: 'Rules to Trigger Playlist',
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
        let table = document.querySelector('#playlists_table tbody');
        const _self = this;
        Sortable.create(table, {
            draggable: 'tr',
            handle: '.drag-handle',
            onEnd: (newIndex, oldIndex) => {
                this.reorder(newIndex, oldIndex);
            }
        });
    }
}
</script>
