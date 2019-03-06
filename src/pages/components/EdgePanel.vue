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
          @input="handleStyleChange('strokeWidth',$event.target.value)"/>
        <ElPopover
          popper-class="line-popper"
          placement="bottom"
          width="80"
          trigger="click">
          <div
            class="style-select-box"
            slot="reference">
            <div :class="selectStyleClass"></div>
          </div>
          <ul
            class="line-box">
            <li
              @click="handleStyleChange('dashed',0)">
              <div class="solid-line"></div>
            </li>
            <li
              @click="handleStyleChange('dashed',1)">
              <div class="dashed-line"></div>
            </li>
          </ul>
        </ElPopover>
        <input
          :value="color"
          class="edge-color"
          type="color"
          @input="handleStyleChange('strokeColor',$event.target.value)"/>
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
      type: [String, Number],
      required: true,
    },
    dashed: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      required: true,
    },
    handleStyleChange: {
      type: Function,
      required: true,
    },
  },

  computed: {
    selectStyleClass() {
      return this.dashed ? 'dashed-line' : 'solid-line';
    },
  },

  components: {
    Panel,
  },
}
</script>

<style lang="less" scoped>
.content {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  .edge-width {
    padding-left: 2px;
    width: 44px;
    border-radius: 4px;
  }
  .edge-color {
    border-radius: 4px;
  }
  .style-select-box {
    display: flex;
    align-items: center;
    border: 1px solid #b9b9b9;
    border-radius: 4px;
    box-sizing: border-box;
    padding: 8px;
    width: 50px;
    height: 24px;
    cursor: pointer;
  }
}
</style>
<style lang="less">
.line-popper {
  min-width: 80px;
  .line-box {
    > li {
      cursor: pointer;
      padding: 9px 0;
    }
  }
}

.solid-line {
  width: 100%;
  border-bottom: 1px solid #000;
}

.dashed-line {
  width: 100%;
  border-bottom: 1px dashed #000;
}
</style>
