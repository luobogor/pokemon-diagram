<template>
  <section class="panel">
    <h4>{{title}}</h4>
    <slot/>
  </section>
</template>

<script>
export default {
  name: 'Panel',
  props: {
    title: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang="less" scoped>
  .panel {
    position: relative;
    background: #fff;
    padding: 0;
    margin: 0;
    > h4 {
      padding: 16px;
      text-align: left;
      color: #333;
      font-size: 16px;
    }
  }
</style>
