<template>

    <v-layout row wrap>
        <v-flex xs1>
            <v-progress-circular
              :size="15"
              :width="2"
              :rotate="270"
              :indeterminate="loading"
              :value="refresh_percentage"
              :color="(loading)? 'green' : 'red'"/>
      </v-flex>
      <v-flex xs11>
          <div class="eve-font">
              <h3 class="font-weight-black">{{ header }} : </h3>
          </div>
      </v-flex>
      <v-flex xs1>

      </v-flex>
      <v-flex>
          <slot :api_data="api_data" :error="error">
              Missing template
          </slot>
      </v-flex>
  </v-layout>

</template>

<script>

import axios from 'axios';

export default {

    data() {
        return {
            loading: false,
            error: false,
            timer: null,
            expires: 0,
            last_modified: 0,
            age: 0,
            refresh_percentage: 100,
            range: 0,
            api_data: {}
        }
    },

    props: ['header', 'url'],

    methods: {
        tick() {
            //console.log(this.header, ': tick()');
            this.stop();
            this.age = this.expires - Date.now();
            this.refresh_percentage = 100 - Math.round((parseFloat(this.age) / parseFloat(this.range)) * 100);

            if (this._isDestroyed || this._inactive || !this._isMounted) {
                return;
            }

            if (this.age <= 0) {
                this.age = 0;
                this.refresh_percentage = 100;
                this.start();
            } else {
                this.timer = setTimeout(this.tick, 1000);
            }
        },

        start() {

            // console.log(this.header, ': start()');

            if (this.loading === true) {
                console.log(this.header, ': start() - Already started...');
                return;
            }

            this.loading = true;
            this.stop();

            return axios.get(this.url)
            .then((res) => {
                // console.log(this.header + ': status:', res.status);
                if (res.status === 304) {
                    console.log('cached');
                }
                this.error = false;
                this.expires = Date.parse(res.headers['expires']);
                this.last_modified = Date.parse(res.headers['last-modified']);
                this.age = this.expires - Date.now();
                this.range = this.expires - this.last_modified;
                this.refresh_percentage = 100 - Math.round(parseFloat(this.age) / parseFloat(this.range) * 100);
                this.api_data = res.data;

                this.loading = false;

                this.$emit('new-data', res.data);
                this.timer = setTimeout(this.tick, 1000);
            })
            .catch((err) => {

                this.loading = false;
                this.error = true;

                this.last_modified = Date.now();
                this.expires = this.last_modified + 30000;
                this.range = this.expires - this.last_modified;
                this.age = this.expires - Date.now();
                this.refresh_percentage = 100;

                this.timer = setTimeout(this.tick, 1000);
            });
        },

        stop() {
            //console.log(this.header + ': stop()');
            if (this.timer) {
                //console.log(this.header + ': stop() - Cancelling timer');
                clearTimeout(this.timer);
                this.timer = null;
            }
        }
    },

    beforeDestroy() {
        this.stop();
    },

    mounted() {
        // this.start();
    }
}
</script>
