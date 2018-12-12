<template>
  <v-navigation-drawer
    v-model="drawer"
    fixed
    clipped
    app
    stateless
    width="300"
    v-if="active_character_id"
  >
    <v-card>
      <v-card-title primary-title>
        <v-flex xs3>
          <v-avatar>
            <img :src="active_character_portrait">
            </v-avatar>
        </v-flex>
        <v-flex>
          <h4 class="text-uppercase font-weight-black">
            {{ active_character_name }}
          </h4>
      </v-flex>
  </v-card-title>
      <v-card-text>
        <div>
          <div>Status: Offline</div>
          <div>Location: Jita</div>
        </div>
    </v-card-text>
</v-card>
    <!--
    <v-list dense>
        <v-list-tile @click="$router.push({name:'spotify'})">
            <v-list-tile-avatar>
                <img :src="require('../assets/spotify-enabled.svg')" class="spotify-icon">
            </v-list-tile-avatar>
            <v-list-tile-content>
                <v-list-tile-title>Spotify</v-list-tile-title>
                <v-list-tile-sub-title>
                    Configure your Spotify account
                </v-list-tile-sub-title>
            </v-list-tile-content>
        </v-list-tile>
    </v-list>
-->
</v-navigation-drawer>
</template>

<script>

export default {

    data() {
        return {
            drawer: false
        }
    },

    watch: {
        active_character_id(newVal) {
            console.log('active_character_id changed:', newVal);
            if (newVal) {
                this.drawer = true;
            }
        }
    },

    computed: {
        active_character_id() {
            return this.$store.state.active_character_id;
        },

        active_character_name() {
            return this.$store.state.active_character_name;
        },

        active_character_portrait() {
            return '/portraits/' + this.active_character_id + '_512.jpg';
        }
    },

    mounted() {
        if (this.active_character_id) {
            this.drawer = true;
        }
    }

}
</script>
