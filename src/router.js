import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

export function createRouter() {
  return new VueRouter({
    mode: 'history',
    routes: [
      { path: '/', component: () => import('./components/Home.vue') },
      { path: '/foo/:id', component: () => import('./components/Foo.vue') },
      { path: '/home/:id', component: () => import('./components/Home.vue') }
    ]
  })
}