<template>
  <v-flex xs6>
    <v-card>
      <v-toolbar
        card
        dark
      >
        <v-toolbar-title>Spotify Devices</v-toolbar-title>
    </v-toolbar>
      <v-card-text>
        <p>
          Select the device you want to play music from:
        </p>
        <v-btn
          :loading="refreshing_devices"
          :disabled="refreshing_devices"
          @click="refreshDevices"
        >
          Refresh Devices
      </v-btn>
  </v-card-text>

      <v-list dense>
        <v-list-title
          v-for="device in devices"
          :key="device.id"
        >
          <v-list-tile-avatar>
            <v-icon v-if="device.type == 'Computer'">
              computer
          </v-icon>
            <v-icon v-if="device.type == 'Smartphone'">
              phonelink_ring
          </v-icon>
      </v-list-tile-avatar>
          <v-list-tile-content>
            <v-list-tile-title>{{ device.name }}</v-list-tile-title>
            <v-list-tile-sub-title>{{ device.id }}</v-list-tile-sub-title>
        </v-list-content>
          <v-list-tile-action>
            <v-switch
              v-model="device_selected[device.id]"
            />
        </v-list-tile-action>
    </v-list-tile>
</v-list>
</v-card>
</v-flex>
</template>

<script>

import axios from 'axios';

export default {
    data() {
        return {
            refreshing_devices: false,
            devices: [],
            device_selected: {}
        }
    },

    methods: {
        refreshDevices() {
            this.refreshing_devices = true;

            axios.get('/api/spotify/devices')
            .then((res) => {
                this.refreshing_devices = false;
                this.devices = res.data.devices;
                this.devices.forEach((device) => {
                    this.device_selected[device.id] = false;
                });
            });
        }
    }
}
</script>
