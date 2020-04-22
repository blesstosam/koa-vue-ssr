import 'es6-promise/auto'
import Vue from 'vue'
import { createApp } from './app'
import { getLocation } from './help/index'
import ProgressBar from './components/ProgressBar.vue'


const bar = Vue.prototype.$bar = new Vue(ProgressBar).$mount()
document.body.appendChild(bar.$el)

// 当路由参数发生改变 只能发生在客户端路由跳转阶段 这个方法一定要注册
Vue.mixin({
  beforeRouteUpdate(to, from, next) {
    const { asyncData } = this.$options
    if (asyncData) {
      asyncData({
        store: this.$store,
        route: to
      }).then(next).catch(next)
    } else {
      next()
    }
  },

  // beforeMount() {
  //   const { serverRendered, data } = window.__INITIAL_STATE__
  //   // if (!serverRendered) {
  //   //   window.
  //   // }
  //   // this.data = { ...this.data, ...data[0] }
  //   if (!data.length) return;
  //   console.log(data, 'llllll')
  //   Object.keys(data[0]).forEach(key => {
  //     Vue.set(this.$data, key, data[0][key])
  //     window.__INITIAL_STATE__.data = []
  //   })
  // }
})

const { app, router, store } = createApp()

// 将服务器获取的数据放到客户端的store里
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__.state)
}


router.onReady(() => {
  // 在beforeEnter 之后被调用 所有组件内守卫和异步路由组件被解析之后
  // 客户端路由跳转之前执行asyncData函数
  router.beforeResolve((to, from, next) => {
    const matched = router.getMatchedComponents(to)
    const prevMatched = router.getMatchedComponents(from)

    // 我们只关心非预渲染的组件
    // 所以我们对比它们，找出两个匹配列表的差异组件
    let diffed = false
    const activated = matched.filter((c, i) => {
      return diffed || (diffed = (prevMatched[i] !== c))
    })
    // filter(_ => _) 可以去掉数组中的undefined
    const asyncDataHooks = activated.map(c => c.asyncData).filter(_ => _)
    if (!asyncDataHooks.length) {
      return next()
    }

    bar.start()
    Promise.all(asyncDataHooks.map(hook => hook({ store, route: to })))
      .then((res) => {
        // console.log(res, 'res', window.__INITIAL_STATE__)
        // TODO: 将数据挂载到data上???
        // if (typeof matched[0] === 'function') {
        //   console.log('reslove.......')
        //   await matched[0]
        // }
        const path = getLocation(router.options.base, router.options.mode)
        console.log(matched, matched[0].options, 'matched', to.matched[0])
        // console.log(matched[0].data(), res[0])

        // 拿到 Component.options.data 调用 并修改 Component.options.data
        // const ComponentData = Component.options._originDataFn || Component.options.data || function () { return {} }
        // Component.options._originDataFn = ComponentData
        // Component.options.data = function () {
        //   return { ...data, ...res[0] }
        // }

        // 直接修改 Component.data 是不行的
        matched[0].data = function () {
          return {
            ...matched[0].data,
            ...res[0]
          }
        }
        // store.commit('setItem', { id: res[0].item.id, item: res[0].item })
        bar.finish()
        next()
      })
      .catch(next)
  })

  // 重要：挂载app的时候 要确保服务端的html 标签和客户端的一致 
  //      由于浏览器会自动给一些不标准的标签添加额外的标签 所以有可能服务端和客户端的不一致 导致挂载失败
  app.$mount('#app')
})
