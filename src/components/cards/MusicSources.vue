<template>
<v-card>
    <v-toolbar dark>
        <v-toolbar-title>Music Sources</v-toolbar-title>
    </v-toolbar>
  <v-card-text>
      <v-progress-circular
      indeterminate
      v-if="loading_sources"/>
    <div v-else-if="musicSources.length === 0">
        You have no music sources available.
    </div>
    <v-list v-else-if="musicSources.length > 0">
        <v-subheader>Sources</v-subheader>
      <v-list-tile v-for="source in musicSources" :key="source.id" @click="activateMusicSource(source.id)">
        <v-list-tile-content>
          {{ source.service_name }}
        </v-list-tile-content>
        <v-list-tile-action>
            <v-btn icon ripple v-if="processing_source !== source.id">
                <v-icon @click="deleteSource(source.id)">delete</v-icon>
            </v-btn>
            <v-progress-circular
            indeterminate
            v-else/>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>
  </v-card-text>
  <v-card-actions>
    <v-btn @click="add_musicsource_dialog = true">
      Add Music Source
    </v-btn>
  </v-card-actions>

  <v-dialog v-model="add_musicsource_dialog" max-width="450">
      <AddMusicSourceStepper @source-added="refreshSources(); add_musicsource_dialog = false"/>
  </v-dialog>
</v-card>
</template>

<script>
import axios from 'axios';

import AddMusicSourceStepper from '../steppers/AddMusicSource.vue';

export default {

    components: {
        AddMusicSourceStepper
    },

    data() {
        return {
            add_musicsource_dialog: false,
            loading_sources: true,
            processing_source: null,
            musicSources: [],
            services:  []
        }
    },

    methods: {
        refreshSources() {
            this.loading_sources = true;
            axios.get('/api/music_sources/linked')
            .then((res) => {
                this.musicSources = res.data.musicSources;
                return axios.get('/api/music_sources/available');
            })
            .then((res) => {
                this.loading_sources = false;
                this.services = res.data.plugins
            });
        },

        deleteSource(sourceId) {
            this.processing_source = sourceId;

            axios.delete('/api/music_sources/linked/' + sourceId)
            .then(() => {
                this.processing_source = null;
                this.$emit('delete-music-source');
                this.refreshSources();
            });
        },

        activateMusicSource(sourceId) {
            this.$store.dispatch('activate_musicsource', sourceId);
            this.$emit('cancel');
        },
    },

    mounted() {
        this.refreshSources();
    }
}
</script>
