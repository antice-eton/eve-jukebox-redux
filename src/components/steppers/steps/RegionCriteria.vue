<template>
<v-card>
    <v-card-text>
        <v-autocomplete
            v-model="selected_region"
            :items="regions"
            :loading="loading_regions"
            :search-input.sync="query_region"
            dense
            no-filter
            menu-props="closeOnClick, closeOnContentClick"
            item-text="name"
            item-value="region_id"
            label="Type in a region name"
            return-object/>
            <div class="">
            <v-chip close
                v-for="region in selected_regions"
                :key="region.region_id"
                @input="removeCriteriaRegion(region)"
                small
            >
                {{ region.name }}
            </v-chip>
        </div>
    </v-card-text>
    <v-card-actions>
        <v-btn @click="selected_regions = []; $emit('cancel')">Cancel</v-btn>
        <v-btn @click="$emit('next', selected_regions)">Next</v-btn>
    </v-card-actions>
</v-card>
</template>

<script>

import axios from 'axios';

export default {

    data() {
        return {
            selected_region: '',
            selected_regions: [],
            regions: [],
            query_region: '',
            loading_regions: false
        }
    },

    methods: {
        removeCriteriaRegion(region) {
            var idx = 0;
            for (; idx < this.selected_regions.length; idx++) {
                if (this.selected_regions[idx].region_id = region.region_id) {
                    this.selected_regions.splice(idx, 1);
                    break;
                }
            }
        }
    },

    watch: {
        selected_region(newVal) {
            if (!newVal) { return; }

            if (this.selected_regions.filter((region) => region.region_id === newVal.region_id).length) {
                return;
            }

            this.selected_regions.push(newVal);
            this.selected_region = '';
        },

        query_region(newVal) {
            if (!newVal || this.loading_regions === true) {
                return;
            }

            this.loading_regions = true;

            axios.get('/api/eve/regions?q=' + encodeURI(newVal))
            .then((res) => {
                console.log(res.data);
                this.loading_regions = false;
                // this.query_region = '';
                this.regions = res.data.regions;
            })
            .catch((err) => {
                console.error(err);
                this.loading_regions = false;
                // this.query_region = '';
            });
        },
    }
}

</script>
