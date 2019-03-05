<template>
  <div
    class="edge-panel">
    <Panel
      title="线">
      <section class="content">
        <input
          :value="width"
          class="edge-width"
          min="1"
          type="number"
          @input="handleWidthChange"/>
        <ElPopover
          placement="bottom"
          width="200"
          trigger="click">
          <div slot="reference">
            线条
          </div>
          下面的线条
        </ElPopover>
        <input
          :value="color"
          class="edge-color"
          type="color"
          @input="handleColorChange"/>
      </section>
    </Panel>
  </div>
</template>

<script>
import Panel from 'components/Panel';

export default {
  name: 'EdgePanel',

  props: {
    width: {
      required: true,
    },
    edgeStyle: {
      required: true,
    },
    color: {
      required: true,
    },
    handleWidthChange: {
      required: true,
    },
    handleStyleChange: {
      required: true,
    },
    handleColorChange: {
      required: true,
    },
  },

  components: {
    Panel,
  },
}
</script>

<style lang="less" scoped>
.content {
  display: flex;
  justify-content: space-around;
  .edge-width {
    padding-left: 2px;
    width: 40px;
    border-radius: 4px;
  }
  .edge-color {
    border-radius: 4px;
  }
}
</style>
