<style>
  .test {
    color: red
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
export default {
  name: 'Foo',
  // Todo: 在定义路由的时候 传入 参数 表示asyncdata 是在何时触发的 
  //       ssr(服务器端) | beforeRouteResolve(跳转前) | afterRouteResolve(已跳转)
  // asyncdata 可以在三个地方执行  其中2，3都是客户端数据预取
  // 1. server端 => 服务端数据预取
  // 2. router.beforeResolve 阶段 => 需要等待所有数据获取到了 路由才会跳转 需要配合 loadingbar 否则页面像卡住
  // 3. beforeRouteUpdate 阶段 => 路由已经跳转 所以需要在局部加一些loading来填充数据返回前的空白
  asyncData({ store, route }) {
    // 触发 action 后，会返回 Promise
    return store.dispatch('fetchItem', route.params.id);
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
