import { createApp } from './app'

const { app, router, store } = createApp()

// console.log(window.__INITIAL_STATE__)

// 将服务器获取的数据放到客户端的store里
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

router.onReady(() => {
  // 重要：挂载app的时候 要确保服务端的html 标签和客户端的一致 
  //      由于浏览器会自动给一些不标准的标签添加额外的标签 所以有可能服务端和客户端的不一致 导致挂载失败
  app.$mount('#app')
})
