<template>
<v-data-table
  :headers="headers"
  :items="items"
  hide-actions
  :id="id"
  >
    <template slot="items" slot-scope="props">
        <tr class="sortableRow" :key="props.item.id">
            <td style="max-width: 28px" class="drag-handle">
                <v-icon>sort</v-icon>
            </td>
            <td>{{ props.item.name }}</td>
            <td>{{ props.item.criteria }}</td>
        </tr>
    </template>
</v-data-table>
</template>
