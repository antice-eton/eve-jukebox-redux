import Vue from 'vue';
import './plugins/vuetify'
import App from './App.vue';
// import router from './router';
import store from './store';

console.log('location:', location);

const wshost = (location.protocol !== 'https:') ? 'ws://' + location.host + '/live' : 'wss://' + location.host + '/live';

import VueNativeSock from 'vue-native-websocket';
Vue.use(VueNativeSock, wshost, {
    format: 'json',
    reconnection: true,
    connectManually: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 5000,
    store: store
});

Vue.config.productionTip = false;

import ejrPlugins from './plugins/music_sources/ejr-plugins-ui.js';

Object.keys(ejrPlugins).forEach((pluginName) => {
    if (ejrPlugins[pluginName].setup) {
        Vue.component('ejr-' + pluginName + '-setup', ejrPlugins[pluginName].setup);
    }
});

new Vue({
  // router,
  store,
  render: h => h(App),
}).$mount('#app');
