<template>
<v-card>
    <v-toolbar dark>
        <v-toolbar-title>Music Sources</v-toolbar-title>
    </v-toolbar>
  <v-card-text>
      <v-progress-circular
      indeterminate
      v-if="loading_sources"/>
    <div v-else-if="music_players.length === 0">
        You have no music sources available.
    </div>
    <v-list v-else-if="music_players.length > 0">
        <v-subheader>Sources</v-subheader>
      <v-list-tile v-for="player in music_players" :key="player.id" @click="activatePlayer(player.id)">
        <v-list-tile-content>
          {{ player.service_name }}
        </v-list-tile-content>
        <v-list-tile-action>
            <v-btn icon ripple v-if="processing_player !== player.id" @click.native.prevent="deletePlayer($event, player.id)">
                <v-icon>delete</v-icon>
            </v-btn>
            <v-progress-circular
            indeterminate
            v-else/>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>
  </v-card-text>
  <v-card-actions>
    <v-btn @click="add_musicplayer_dialog = true">
      Add Music Player
    </v-btn>
  </v-card-actions>

  <v-dialog v-model="add_musicplayer_dialog" lazy max-width="450">
      <AddMusicPlayerStepper @player-added="refreshPlayers(); add_musicplayer_dialog = false"/>
  </v-dialog>
</v-card>
</template>

<script>
import axios from 'axios';

import AddMusicPlayerStepper from '../steppers/AddMusicPlayer.vue';

export default {

    components: {
        AddMusicPlayerStepper
    },

    data() {
        return {
            add_musicplayer_dialog: false,
            loading_sources: true,
            processing_player: null,
            music_players: [],
            plugins:  []
        }
    },

    methods: {
        async activatePlayer(playerId) {
            this.processing_player = playerId;
            await axios.post('/api/music_players/' + playerId + '/activate');
            this.$store.commit('ACTIVATE_MUSICPLAYER_ID', playerId);
            this.$emit('cancel');
            this.processing_player = null;
        },

        refreshPlayers() {
            this.loading_sources = true;
            axios.get('/api/music_players')
            .then((res) => {
                this.music_players = res.data.music_players;
                return axios.get('/api/plugins');
            })
            .then((res) => {
                this.loading_sources = false;
                this.plugins = res.data.plugins
            });
        },

        deletePlayer(evt, sourceId) {
            evt.stopPropagation();
            evt.preventDefault();

            this.processing_player = sourceId;

            axios.delete('/api/music_players/' + sourceId)
            .then(() => {
                this.processing_player = null;
                // this.$emit('delete-music-source');
                this.refreshPlayers();
            });
        }
    }
}
</script>
