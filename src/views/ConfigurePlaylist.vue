<template>

<v-content>
    <v-container fluid fill-height>
        <v-layout justify-center>
          <v-flex xs12 sm8 md8>
            <v-card>
                <v-card-title>
                    Playlist Configuration
                </v-card-title>
                <v-card-text>
                    <v-autocomplete
                        v-model="system_selection"
                        :items="systems"
                        :loading="loading"
                        :search-input.sync="system_query"
                        hide-no-data
                        hide-selected
                        item-text="name"
                        item-value="system_id"
                        label="Choose System"
                        prepend-icon="mdi-database-search"
                        return-object/>
                    </v-card-text>
                </v-card>
            </v-flex>
        </v-layout>
    </v-container>
</v-content>
</template>

<script>

import axios from 'axios';

export default {

    data() {
        return {
            systems: [],
            loading: false,
            system_query: null,
            system_selection: null,
        }
    },

    watch: {
        system_query(val) {

            if (this.loading === true || !val) {
                return;
            }

            this.loading = true;

            axios.get('/api/eve/systems?q=' + encodeURI(val))
            .then((res) => {
                console.log(res.data);
                this.loading = false;
                this.systems = res.data.systems;
            })
            .catch((err) => {
                console.error(err);
                this.loading = false;
            });
        }
    }
}
</script>
