// store.js
// 1. 在服务器 store 的作用是 作为一个入口将服务器端数据传递给客户端
// 2. 在客户端 store 的作用和spa里是一致的

import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// 假定我们有一个可以返回 Promise 的
// 通用 API（请忽略此 API 具体实现细节）
import { fetchItem } from './api/index'

export function createStore() {
  return new Vuex.Store({
    state: {
      items: {}
    },
    mutations: {
      setItem(state, { id, item }) {
        Vue.set(state.items, id, item)
      }
    },
    actions: {
      fetchItem({ commit }, id) {
        // `store.dispatch()` 会返回 Promise，
        // 以便我们能够知道数据在何时更新
        return fetchItem(id).then(item => {
          commit('setItem', { id, item })
        })
      },

      // 在这里获取koa的ctx对象 进而获取服务器的状态比如session csrfToken 等
      // 在服务器端调用该函数 => store.dispatch('serverInit', context)  并将ctx对象传过来
      // 然后将数据通过 commit 存到store里去 在客户端会调用store.replaceState 将数据合并到客户端 客户端就可以从store取了
      serverInit({ commit }, ctx) {
        // console.log(ctx, '+++++++++++in serverinit')
      }
    },
  })
}