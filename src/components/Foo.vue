<style>
.test {
  color: red;
}
</style>

<template>
  <div>
    <h1 class="test">{{ msg }}</h1>
    <h2>{{ item }}</h2>
    <router-link to="/home/1">home</router-link>
  </div>
</template>

<script>
import { fetchItem } from '../api/index';

export default {
  name: 'Foo',
  // TODO: 在定义路由的时候 传入 参数 表示asyncdata 是在何时触发的
  //       ssr(服务器端) | beforeRouteResolve(跳转前) | afterRouteResolve(已跳转)
  // asyncdata 可以在三个地方执行  其中2，3都是客户端数据预取 =>
  //           设置好之后只能在一个地方执行 如果只在服务端执行（ssr）的话 在客户端进行路由跳转的时候就不能获取到数据了 nuxt也是这样吗？？？
  // 1. server端 => 服务端数据预取
  // 2. router.beforeResolve 阶段 => 需要等待所有数据获取到了 路由才会跳转 需要配合 loadingbar 否则页面像卡住
  // 3. beforeRouteUpdate 阶段 => 路由已经跳转 所以需要在局部加一些loading来填充数据返回前的空白

  // TODO 这里不调用store来传递状态 和nuxt一样返回数据 并在服务器端处理
  // 然后将数据合并到组件的data  这个需要怎么处理???后台写了逻辑 需要测试下

  // TODO nuxt里 如果是客户端路由跳转 asyndData也会执行 在哪个阶段呢？应该是 beforeRouteEnter 或者 beforeRouteUpdate
  // It will be called server-side once (on the first request to the Nuxt app)
  // and client-side when navigating to further routes
  asyncData({ store, route }) {
    // 触发 action 后，会返回 Promise
    return store.dispatch('fetchItem', route.params.id);
  },

  // 两种写法：then写法和await写法 都是返回promise
  // asyncData() {
  //   return axios.get('/api').then(res => {
  //     return {res}
  //   })
  // }
  // asyncData() {
  //   const res = await axios.get('/api')
  //   return {res}
  // }
  async asyncData({store, route}) {
    console.log('in asyncData')
    const item = await fetchItem(route.params.id)
    // 重要 数据一定要包一层对象
    return { item }
  },
  computed: {
    // 从 store 的 state 对象中的获取 item。
    item() {
      return this.$store.state.items[this.$route.params.id];
    },
  },
  data() {
    return {
      msg: 'Foo',
    };
  },
};
</script>
