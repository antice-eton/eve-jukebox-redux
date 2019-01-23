<template>
<v-stepper v-model="add_musicplayer_step">
  <v-stepper-header>
    <v-stepper-step
      :complete="add_musicplayer_step > 1"
      :step="1"
    >
      Choose Music Player
    </v-stepper-step>
    <v-divider />
    <v-stepper-step
      :complete="add_musicplayer_step > 2"
      :step="2"
    >
      Configure Music Player
    </v-stepper-step>
  </v-stepper-header>

  <v-stepper-items>

    <v-stepper-content :step="1">
      <v-card>
        <v-card-text>
          <v-select v-model="form.selected_plugin"
                    :items="plugins"
                    label="Select music source" />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="add_musicplayer_step = 2" :disabled="!form.selected_plugin">
              Next
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-stepper-content>

    <v-stepper-content :step="2">
      <component :is="musicplayer_component" @player-added="onPlayerAdded" />
    </v-stepper-content>

  </v-stepper-items>
</v-stepper>
</template>

<script>

export default {

    data() {
        return {
            add_musicplayer_step: 1,
            plugins: [{
                text: 'Spotify',
                value: 'spotify'
            },{
                text: 'Foobar2000',
                value: 'foobar'
            }],
            form: {
                selected_plugin: null
            }
        }
    },

    props: ['value'],

    computed: {
        musicplayer_component() {
            if (this.form['selected_plugin']) {
                return 'ejr-' + this.form.selected_plugin + '-setup';
            }
        }
    },

    methods: {
        onPlayerAdded($e) {
            this.add_musicplayer_step = 1;
            this.form.selected_plugin = null;
            this.$emit('player-added', $e);
        }
    },
}

</script>
