<template>
  <ElContainer
    class="app-canvas">
    <ElMain
      class="app-canvas__main">
      <div id="graphContainer"/>
    </ElMain>
    <ElAside
      class="app-canvas__right"
      width="234px">
      <div
        class="element-panel">
        <div
          id="graphOutline"/>
        <ul
          class="element-card-list">
          <li
            v-for="(element,idx) in elements"
            :key="idx">
            <img
              v-bind="element"
              class="element-img"
              :src="`/static/images/${element.icon}`"
              alt="element">
            <p>{{ element.name }}</p>
          </li>
        </ul>
      </div>
    </ElAside>
  </ElContainer>
</template>

<script>
import mxgraph from '../graph/index';
import { genGraph, destroyGraph } from '../graph/Graph';

const {
  mxOutline
} = mxgraph;

let graph = null;
let outline = null;

const initGraph = () => {
  graph = genGraph(document.getElementById('graphContainer'));
  outline = new mxOutline(graph, document.getElementById('graphOutline'));
};
export default {
  name: 'AppCanvas',

  data() {
    return {
      elements: [{
        id: 1,
        icon: 'ele-001.jpeg',
        name: '比卡丘',
      }, {
        id: 2,
        icon: 'ele-002.png',
        name: '小火龙',
      }, {
        id: 3,
        icon: 'ele-003.jpeg',
        name: '杰尼龟 故意 把名字 改长点',
      }, {
        id: 4,
        icon: 'ele-004.jpg',
        name: '妙蛙种子',
      }]
    };
  },

  mounted() {
    initGraph();
  }
}
</script>

<style lang="less" scoped>
.app-canvas {
  &__main {
    #graphContainer {
      position: relative;
      overflow: hidden;
      width: 100%;
      height: 96vh;
      background: url('../assets/images/grid.gif');
      cursor: default;
    }
  }
  &__right {
    padding: 20px 20px 0 0;
    #graphOutline {
      border-radius: 4px;
      border: 1px solid #e6e6e6;
    }
    .element-card-list {
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      > li {
        width: 100px;
        text-align: center;
        margin-bottom: 10px;
        > img {
          width: 100%;
          height: 100px;
        }
        > p {
          color: #333;
          margin-top: 8px;
        }
      }
    }
  }
}
</style>
