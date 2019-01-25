<template>
<v-autocomplete
    :value="value"
    @input="$emit('input', $event)"
    :items="systems"
    :loading="loading_systems"
    :search-input.sync="query_system"
    dense
    no-filter
    menu-props="closeOnClick, closeOnContentClick"
    item-text="name"
    item-value="region_id"
    label="Type in a region name"
    return-object/>

</template>

<script>

import axios from 'axios';

export default {

    props: ['value'],

    data() {
        return {
            systems: [],
            query_system: '',
            loading_systems: false
        }
    },

    watch: {
        query_region(newVal) {
            if (!newVal || this.loading_systems === true) {
                return;
            }

            console.log('system:', newVal);

            this.loading_systems = true;

            axios.get('/api/eve/systems?q=' + encodeURI(newVal))
            .then((res) => {
                console.log(res.data);
                this.loading_systems = false;
                // this.query_region = '';
                this.systems = res.data.systems;
            })
            .catch((err) => {
                console.error(err);
                this.loading_systems = false;
                // this.query_region = '';
            });
        },
    }
}

</script>
