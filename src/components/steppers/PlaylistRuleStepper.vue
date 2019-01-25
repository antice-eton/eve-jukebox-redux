<template>
<v-stepper v-model="step">
  <v-stepper-header>
    <v-stepper-step
      :complete="step > 1"
      :step="1"
    >
      Choose Playlist
    </v-stepper-step>
    <v-divider />
    <v-stepper-step
      :complete="step > 2"
      :step="2"
    >
      Setup Criteria
    </v-stepper-step>
  </v-stepper-header>

  <v-stepper-items>

    <v-stepper-content :step="1">
        <PlaylistSelectorCard @player="player_selected" @playlist="playlist_selected" @next="step = 2" @cancel="$emit('cancel', $event)" />
    </v-stepper-content>
    <v-stepper-content :step="2">
        <PlaylistRuleEditorCard @close="$emit('cancel', $event)" :playlist="selected_playlist" />
    </v-stepper-content>
</v-stepper-items>
</v-stepper>
</template>

<script>

import axios from 'axios';
import AutoComplete from '../AutoComplete.vue';
import Sortable from 'sortablejs';
import PlaylistRuleEditorCard from '../cards/PlaylistRuleEditorCard.vue';
import PlaylistSelectorCard from '../cards/PlaylistSelectorCard.vue';

export default {
    components: {
        AutoComplete,
        PlaylistRuleEditorCard,
        PlaylistSelectorCard
    },

    data() {
        return {
            selected_player: null,
            selected_playlist: null,
            step: 1,
            rules_disabled: true,
            playlist: {}
        }
    },

    methods: {
        async playlist_selected(playlist) {
            console.log('playlist selected:', playlist);
            this.selected_playlist = playlist;

            this.rules_disabled = false;
        },

        on_saved_rule(rule) {
            this.$emit('new-rule', rule);
        },

        player_selected(player) {
            this.selected_player = player;
        }


    }
}
</script>
