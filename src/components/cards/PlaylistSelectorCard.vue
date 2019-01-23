<template>
<v-card>
  <v-card-text>
      <v-select
          :items="players"
          label="Select Music Player"
          :loading="loading_players"
          :disabled="loading_players"
          v-model="selected_player"
          box>
      </v-select>
      <v-select
          :items="player_playlists"
          label="Select Playlist"
          :loading="loading_player_playlists"
          :disabled="loading_player_playlists"
          v-model="selected_player_playlist"
          box>
      </v-select>
  </v-card-text>
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
            player_playlists: []
        }
    },

    watch: {
        selected_player(newVal) {
            if (newVal) {
                this.load_playlists(newVal);
            }

            this.$emit('player', newVal);
        },

        selected_player_playlist(newVal) {
            this.$emit('playlist', newVal);
        }
    },

    computed: {
        active_musicplayer_id() {
            return this.$store.state.active_musicplayer_id
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

            this.players = res.data.music_players.map((player) => {
                return {
                    text: player.service_displayName,
                    value: player.id
                }
            });

            if (this.active_musicplayer_id) {
                this.selected_player = this.active_musicplayer_id;
            } else if (this.players.length === 1) {
                this.selected_player = this.players[0].id;
            }

            this.loading_players = false;
        },

        async load_playlists(player_id) {
            this.loading_player_playlists = true;

            const res = await axios.get('/api/music_players/' + player_id + '/playlists');

            this.player_playlists = res.data.player_playlists.map((playlist) => {
                return {
                    text: playlist.name,
                    value: playlist.id
                }
            });

            this.loading_player_playlists = false;
        }
    },

    mounted() {
        this.reload();
    }
}
</script>
