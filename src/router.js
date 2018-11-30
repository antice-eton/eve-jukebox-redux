import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
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
