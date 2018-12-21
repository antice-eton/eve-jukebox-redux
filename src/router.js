import Vue from 'vue';
import Router from 'vue-router';
import Main from './views/Main.vue';
import EveCharacterManagement from './views/EveCharacterManagement.vue';
import ConfigurePlaylist from './views/ConfigurePlaylist.vue';
Vue.use(Router);

export default new Router({
  routes: [
    {
        path: '/',
        name: 'home',
        component: Main,
    },
    {
        path: '/eve-character-management',
        name: 'eve-character-management',
        component: () => import(/* webpackChunkName: "eve-character-management" */ './views/EveCharacterManagement.vue')
    },
    {
        path: '/music-sources',
        name: 'music-sources',
        component: () => import(/* webpackChunkName: "music-sources" */ './views/MusicSources.vue')
    },
    {
        path: '/playlists',
        name: 'playlists',
        component: ConfigurePlaylist
    }
  ],
});
