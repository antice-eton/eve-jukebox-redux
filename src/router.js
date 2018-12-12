import Vue from 'vue';
import Router from 'vue-router';
import Main from './views/Main.vue';
import Login from './views/Login.vue';
import Settings from './views/Settings.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Main,
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
        path: '/settings',
        name: 'settings',
        component: Settings
    },
    {
      path: '/spotify',
      name: 'spotify',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "spotify" */ './views/Spotify.vue'),
    },
    {
        path: '/eve',
        name: 'eve',
        component: () => import(/* webpackChunkName: "eve" */ './views/Eve.vue')
    }
  ],
});
