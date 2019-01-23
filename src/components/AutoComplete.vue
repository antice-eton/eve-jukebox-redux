<template>
<v-autocomplete
    :value="value"
    @input="$emit('input', $event)"
    :items="items"
    :loading="loading"
    :search-input.sync="query"
    dense
    no-filter
    menu-props="closeOnClick, closeOnContentClick"
    :item-text="itemText"
    :item-value="itemValue"
    :label="label"
    return-object/>
</template>

<script>

import axios from 'axios';

export default {
    props: ['value', 'item-text', 'item-value', 'label', 'url', 'item-key'],

    data() {
        return {
            items: [],
            loading: false,
            query: ''
        }
    },

    watch: {
        query(newVal) {
            if (!newVal || this.loading === true) {
                return;
            }

            this.loading = true;

            axios.get(this.url + '?q=' + encodeURI(newVal))
            .then((res) => {
                console.log(res.data);
                this.loading = false;
                // this.query_region = '';
                this.items = res.data[this.itemKey];
            })
            .catch((err) => {
                console.error(err);
                this.loading = false;
                // this.query_region = '';
            });
        }
    }
}
</script>
