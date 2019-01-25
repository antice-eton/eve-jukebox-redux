<template>
<v-card>
  <v-card-text>
      <v-select
          :items="players"
          label="Select Music Player"
          :loading="loading_players"
          :disabled="loading_players"
          v-model="selected_player"
          item-text="service_displayName"
          item-value="id"
          box
          return-object>
      </v-select>
      <v-select
          :items="player_playlists"
          label="Select Playlist"
          :loading="loading_player_playlists"
          :disabled="loading_player_playlists || no_music === true"
          v-model="selected_player_playlist"
          item-text="name"
          item-value="id"
          box
          return-object>
      </v-select>

      <v-checkbox v-model="no_music">
          <div slot="label">
              Check this to turn off the music if the criteria are met.
          </div>
      </v-checkbox>
  </v-card-text>
  <v-card-actions>
      <v-spacer/>
      <v-btn @click="$emit('cancel')">Cancel</v-btn> <v-btn :disabled="next_disabled" @click="$emit('next')" color="blue-grey darken-4">Next</v-btn>
  </v-card-actions>
  <!--
  <v-card-actions>
    <v-btn @click="playlist_rules_step = 2" :disabled="selected_player_playlist === null">
        Next
    </v-btn>
  </v-card-actions>
  -->
</v-card>
</template>

<script>

import axios from 'axios';

export default {
    data() {
        return {
            loading_players: true,
            loading_player_playlists: true,
            selected_player: null,
            selected_player_playlist: null,
            selected_player_playlist_name: null,
            players: [],
            player_playlists: [],
            no_music: false
        }
    },

    watch: {
        selected_player(newVal) {

            console.log('new val:', newVal);

            if (newVal) {
                this.load_playlists(newVal);
            }

            this.$emit('player', newVal);
        },

        no_music(newVal) {
            if (newVal === true) {
                this.selected_player_playlist = {
                    id: 'special-stop',
                    player_id: this.selected_player.id,
                    name: 'Stop Music'
                };
            }
        },

        selected_player_playlist(newVal) {
            this.$emit('playlist', newVal);
        }
    },

    computed: {
        active_musicplayer_id() {
            return this.$store.state.active_musicplayer_id
        },

        next_disabled() {
            if (this.selected_player_playlist !== null) {
                return false;
            } else {
                return true;
            }
        }
    },

    methods: {
        reload() {
            this.selected_player = null;
            this.selected_player_playlist = null;
            this.selected_player_playlist_name = null;

            this.load_players();

        },

        async load_players() {
            this.loading_players = true;

            const res = await axios.get('/api/music_players');
            this.players = res.data.music_players;

            if (this.active_musicplayer_id) {
                this.selected_player = this.players.filter((p) => p.id == this.active_musicplayer_id).pop();
            } else if (this.players.length === 1) {
                this.selected_player = this.players[0];
            }

            this.loading_players = false;
        },

        async load_playlists(player) {

            if (player.id === 'special-stop') {
                this.loading_player_playlists = false;
                this.selected_player_playlist = {id: 'special-stop', name: 'Turn off Music'}
                this.selected_player_playlist_name = 'Turn off Music';
                this.player_playlists = [];
                return;
            }

            this.loading_player_playlists = true;

            const res = await axios.get('/api/music_players/' + player.id + '/playlists');

            this.player_playlists = res.data.player_playlists;

            this.loading_player_playlists = false;
        }
    },

    mounted() {
        this.reload();
    }
}
</script>
