<template>
<div>
    <AutoComplete
        item-key="systems"
        item-text="name"
        item-value="system_id"
        url="/api/eve/systems"
        label="Type system name"
        v-model="selected_system"
        :key="'system_select'"
        />

    <v-select
        item-text="name"
        item-value="station_id"
        label="Select Station"
        :value="value"
        @input="$emit('input', $event)"
        :loading="loading_stations"
        :items="stations"
        :disabled="loading_stations || stations.length === 0"
        return-object/>
</div>

</template>

<script>

import AutoComplete from '../../AutoComplete.vue';
import axios from 'axios';

export default {
    components: {
        AutoComplete
    },
    props: ['value'],
    data() {
        return {
            selected_system: null,
            loading_stations: false,
            stations: []
        }
    },

    watch: {
        async selected_system(newVal) {
            console.log('selected system:', newVal);
            if (newVal) {
                this.loading_stations = true;
                const res = await axios.get('/api/eve/stations?system_id=' + encodeURIComponent(newVal.system_id));
                this.stations = res.data.stations;
                this.loading_stations = false;
            } else {
                this.stations = [];
            }
        }
    }
}
</script>
