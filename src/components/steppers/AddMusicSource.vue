<template>
<v-stepper v-model="add_musicsource_step">
  <v-stepper-header>
    <v-stepper-step
      :complete="add_musicsource_step > 1"
      :step="1"
    >
      Choose Music Source
    </v-stepper-step>
    <v-divider />
    <v-stepper-step
      :complete="add_musicsource_step > 2"
      :step="2"
    >
      Configure Music Source
    </v-stepper-step>
  </v-stepper-header>

  <v-stepper-items>

    <v-stepper-content :step="1">
      <v-card>
        <v-card-text>
          <v-select v-model="form.selected_service"
                    :items="services"
                    label="Select music source" />
        </v-card-text>
        <v-card-actions>
          <v-btn @click="add_musicsource_step = 2" :disabled="!form.selected_service">
              Next
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-stepper-content>

    <v-stepper-content :step="2">
      <component :is="musicsource_component" @source-added="onSourceAdded" />
    </v-stepper-content>

  </v-stepper-items>
</v-stepper>
</template>

<script>

export default {

    data() {
        return {
            add_musicsource_step: 1,
            services: [{
                text: 'Spotify',
                value: 'spotify'
            },{
                text: 'Foobar2000',
                value: 'foobar'
            }],
            form: {
                selected_service: null
            }
        }
    },

    props: ['value'],

    computed: {
        musicsource_component() {
            if (this.form['selected_service']) {
                return 'ejr-' + this.form.selected_service + '-setup';
            }
        }
    },

    methods: {
        onSourceAdded($e) {
            this.add_musicsource_step = 1;
            this.form.selected_service = null;
            this.$emit('source-added', $e);
        }
    },
}

</script>
