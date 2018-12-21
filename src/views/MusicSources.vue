<template>
  <v-content>
    <v-container
      fluid
      fill-height
    >
      <v-layout justify-center>
        <VFlex
          xs12
          sm8
          md8
        >
          <v-card>
            <v-card-title>Music Sources</v-card-title>
            <v-card-text>
                <v-progress-circular
                indeterminate
                v-if="loading_sources"/>
              <div v-else-if="musicSources.length === 0">
                  You have no music sources available.
              </div>
              <v-list v-else-if="musicSources.length > 0">
                <v-list-tile v-for="source in musicSources" :key="source.id">
                  <v-list-tile-content @click="activateMusicSource(source.id)">
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
              <v-btn @click="addMusicSource = 1; addMusicSourceDialog = true">
                Add Music Source
              </v-btn>
            </v-card-actions>
          </v-card>
        </VFlex>

        <v-dialog
          v-model="addMusicSourceDialog"
          persistent
          max-width="600px"
        >
          <v-stepper v-model="addMusicSource">
            <v-stepper-header>
              <v-stepper-step
                :complete="addMusicSource > 1"
                step="1"
              >
                Choose Music Source
              </v-stepper-step>
              <v-divider />
              <v-stepper-step
                :complete="addMusicSource > 2"
                step="2"
              >
                Configure Music Source
              </v-stepper-step>
            </v-stepper-header>
            <v-stepper-items>
              <v-stepper-content step="1">
                <v-card>
                  <v-card-text>
                    <v-select v-model="serviceName"
                              :items="services"
                              label="Select music source" />
                  </v-card-text>
                  <v-card-actions>
                    <v-btn @click="addMusicSourceStepTwo" :disabled="!serviceName">
                        Next
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-stepper-content>
              <v-stepper-content step="2">
                <component :is="addMusicSourceStepComponent" @source-added="onSourceAdded" />
              </v-stepper-content>
            </v-stepper-items>
          </v-stepper>
        </v-dialog>
        <!--

                <v-card>
                    <v-card-title>
                        Add Music Source
                    </v-card-title>
                    <v-card-text>
                        Use this dialog box to add a music source
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer/>
                        <v-btn @click="addMusicSourceDialog = false">Next</v-btn>
                    </v-card-actions>
                </v-card>
            -->
      </v-layout>
    </v-container>
  </v-content>
</template>

<script>

var __auth_window;

import axios from 'axios';

export default {

    data() {
        return {
            processing_source: false,
            loading_sources: false,
            deleting_music_source: null,
            addMusicSource: 0,
            addMusicSourceDialog: false,
            linking_spotify: false,
            musicSources: [],
            spotify_users: [],
            serviceName: null,
            services: [{
                text: 'Spotify',
                value: 'spotify'
            },{
                text: 'Foobar2000',
                value: 'foobar'
            }],
            addMusicSourceStepComponent: null
        };
    },

    methods: {
        /*
        addMusicSource() {
            this.addMusicSourceDialog = true;
            console.log('Add music source');
        },
        */
        addMusicSourceStepTwo() {
            console.log('service name:', this.serviceName);
            this.addMusicSourceStepComponent = 'ejr-' + this.serviceName + '-setup'; //sources[this.serviceName];
            this.addMusicSource = 2;
        },

        onSourceAdded() {
            console.log('a new music source appears');
            this.addMusicSource = 0;
            this.addMusicSourceDialog = false;
            this.serviceName = null;
            this.refreshSources();

        },

        deleteSource(sourceId) {
            this.processing_source = sourceId;
            axios.delete('/api/music_sources/linked/' + sourceId)
            .then(() => {
                this.processing_source = null;
                this.refreshSources();
            });
        },

        activateMusicSource(sourceId) {
            this.processing_source = true;
            axios.post('/api/music_sources/linked/' + sourceId + '/activate')
            .then(() => {
                this.$router.push('/');
            });
        },

        getPlaylists(sourceId) {
            axios.get('/api/music_sources/linked/' + sourceId + '/playlists');
        },

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
        }
    },

    mounted() {
        this.refreshSources();
    }
}

</script>
