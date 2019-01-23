<template>
<v-stepper v-model="playlist_rules_step">
  <v-stepper-header>
    <v-stepper-step
      :complete="playlist_rules_step > 1"
      :step="1"
    >
      Choose Playlist
    </v-stepper-step>
    <v-divider />
    <v-stepper-step
      :complete="playlist_rules_step > 2"
      :step="2"
    >
      Setup Rules
    </v-stepper-step>
  </v-stepper-header>

  <v-stepper-items>

    <v-stepper-content :step="1">
        <PlaylistSelectorCard @player="player_selected" @playlist="playlist_selected" />
        <v-btn :disabled="rules_disabled" @click="playlist_rules_step = 2">Next</v-btn>
    </v-stepper-content>
    <v-stepper-content :step="2">
        <PlaylistRulesCard :playlist="playlist" />
    </v-stepper-content>
</v-stepper-items>
</v-stepper>
</template>

<script>

import axios from 'axios';
import AutoComplete from '../AutoComplete.vue';
import Sortable from 'sortablejs';
import PlaylistRulesCard from '../cards/PlaylistRulesCard.vue';
import PlaylistSelectorCard from '../cards/PlaylistSelectorCard.vue';

export default {
    components: {
        AutoComplete,
        PlaylistRulesCard,
        PlaylistSelectorCard
    },

    data() {
        return {
            selected_player: null,
            selected_playlist: null,
            playlist_rules_step: 1,
            rules_disabled: true,
            playlist: {}
        }
    },

    methods: {
        async playlist_selected(playlist) {
            this.selected_playlist = playlist;

            const res = await axios.get('/api/music_players/' + this.selected_player + '/playlists/' + this.selected_playlist);
            this.playlist = res.data;


            this.rules_disabled = false;
        },

        player_selected(player) {
            this.selected_player = player;
        }
    }
}
</script>
