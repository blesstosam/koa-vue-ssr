<template>
  <div>
    <h1>{{ msg }}</h1>
    333
    <router-link to="/foo/1">foo</router-link>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      msg: 'Home',
    };
  },
  metaInfo: {
    title: 'sam'
  },
};
</script>
