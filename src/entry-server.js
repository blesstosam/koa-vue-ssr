// entry-server.js
import { createApp } from './app'

// 服务器 entry 使用 default export 导出函数
// 每一个渲染请求都会重复调用此函数
// context 为 koa服务器传递过来的ctx加上一些自定义参数（后面加上类型 规定具体有哪些参数）
export default context => {
  // 因为有可能会是异步路由钩子函数或组件，所以我们将返回一个 Promise，
  // 以便服务器能够等待所有的内容在渲染前，就已经准备就绪。
  return new Promise((resolve, reject) => {
    const { app, router, store } = createApp()

    context.meta = app.$meta() // 获取实例上的$meta 挂载到context上 在renderToString 后可以使用

    // 设置服务器端 router 的位置
    router.push(context.url);

    // 等到 router 将可能的异步组件和钩子函数解析完
    // router 就一个作用 检查是否能匹配搭配定义好的路由 匹配成功 渲染页面 匹配失败 渲染404页面
    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents()
      // 匹配不到的路由，执行 reject 函数，并返回 404
      if (!matchedComponents.length) {
        return reject({ code: 404 })
      }

      // todo 调用vuex里定义的serverInit 并将ctx传递过去
      store.dispatch('serverInit', context)

      // todo 这里也可以不经过store传递asyncdata里的数据
      // asyncData 直接将将数据返回 在后台拿到数据 赋值给 context.state 效果是一样的
      // async asyncData() {
      //   const res = await fetch('/api/user')
      //   return res
      // }
      // const res = Component.asyncData({
      //   store,
      //   route: router.currentRoute
      // })
      // 这里把数据混合到data上 就不走state了
      // Component.data = {
      //   ...Comment.data,
      //   res
      // }
      // context.state = { res }


      // 对所有匹配的路由组件调用 `asyncData()`
      Promise.all(matchedComponents.map(Component => {
        if (Component.asyncData) {
          return Component.asyncData({
            store,
            route: router.currentRoute
          })
        }
      })).then(() => {
        // 在所有预取钩子(preFetch hook) resolve 后，
        // 我们的 store 现在已经填充入渲染应用程序所需的状态。
        // 当我们将状态附加到上下文，
        // 并且 `template` 选项用于 renderer 时，
        // 状态将自动序列化为 `window.__INITIAL_STATE__`，并注入 HTML。
        context.state = store.state

        resolve(app)
      }).catch(reject)

    }, reject)
  })
}