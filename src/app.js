// app.js
import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router'
import { createStore } from './store'

import Meta from 'vue-meta'
Vue.use(Meta)

// 可以实现在store里使用$route对象(当前路由对象) => state.route
import { sync } from 'vuex-router-sync'

export function createApp() {
  // 创建 router 实例
  const router = createRouter()
  const store = new createStore()

  // 同步路由状态(route state)到 store
  sync(store, router)

  const app = new Vue({
    // 注入 router 到根 Vue 实例
    router,
    store,
    render: h => h(App)
  })

  // 返回 app 和 router, store
  return { app, router, store }
}