import Vue from 'vue';
import './plugins/vuetify'
import App from './App.vue';
// import router from './router';
import store from './store';

import VueNativeSock from 'vue-native-websocket';
Vue.use(VueNativeSock, 'ws://' + location.host + '/live', {
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
    console.log('adding views for: ', pluginName);
    if (ejrPlugins[pluginName].setup) {
        Vue.component('ejr-' + pluginName + '-setup', ejrPlugins[pluginName].setup);
    }
});

new Vue({
  // router,
  store,
  render: h => h(App),
}).$mount('#app');
