<template>
  <ElContainer
    class="app-canvas">
    <ElMain
      class="app-canvas__main">
      <div
        class="tool-bar">
        <ElButton
          type="text"
          size="mini">
          导入
        </ElButton>
        <ElButton
          type="text"
          size="mini"
          disabled>
          导出
        </ElButton>
        <ElButton
          type="text"
          size="mini"
          disabled>
          删除
        </ElButton>
      </div>
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
          class="elements">
          <li
            class="element"
            v-for="(element,idx) in elements"
            :key="idx">
            <img
              v-bind="element"
              class="element-img"
              :src="`/static/images/ele/${element.icon}`"
              :alt="element.title">
            <p>{{ element.title }}</p>
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
  mxOutline,
  mxEvent,
  mxCell,
  mxGeometry,
  mxUtils,
} = mxgraph;

let graph = null;
let outline = null;

const makeDraggable = (sourceEles) => {
  const dropValidate = function (evt) {
    const x = mxEvent.getClientX(evt);
    const y = mxEvent.getClientY(evt);
    // 获取 x,y 所在的元素
    const elt = document.elementFromPoint(x, y);
    // 如果鼠标落在graph容器
    if (mxUtils.isAncestorNode(graph.container, elt)) {
      return graph;
    }
    // 鼠标落在其他地方
    return null;
  };

  // drop成功后新建一个节点
  const dropSuccessCb = function (_graph, evt, target, x, y) {
    const source = this.element;
    const src = source.getAttribute('src');

    const nodeRootVertex = new mxCell('Name', new mxGeometry(0, 0, 100, 135), `node;image=${src}`);
    nodeRootVertex.vertex = true;

    const title = source.getAttribute('alt');
    const titleVertex = graph.insertVertex(nodeRootVertex, null, title,
      0.1, 0.65, 80, 16,
      'constituent=1;whiteSpace=wrap;strokeColor=none;fillColor=none;fontColor=#e6a23c',
      true);
    titleVertex.setConnectable(false);

    const normalTypeVertex = graph.insertVertex(nodeRootVertex, null, null,
      0.05, 0.05, 19, 14,
      `normalType;constituent=1;fillColor=none;image=/static/images/normal-type/fire.png`,
      true);
    normalTypeVertex.setConnectable(false);

    const cells = graph.importCells([nodeRootVertex], x, y, target);
    if (cells != null && cells.length > 0) {
      graph.setSelectionCells(cells);
    }
  };

  Array.from(sourceEles).forEach((ele) => {
    const dragElt = document.createElement('img');
    dragElt.setAttribute('src', ele.getAttribute('src'));
    dragElt.setAttribute('style', 'width:120px;height:120px;');

    mxUtils.makeDraggable(ele, dropValidate, dropSuccessCb, dragElt,
      null, null, null, true);
  });
};

const initGraph = () => {
  graph = genGraph(document.getElementById('graphContainer'));
  outline = new mxOutline(graph, document.getElementById('graphOutline'));
  makeDraggable(document.getElementsByClassName('element-img'));
};
export default {
  name: 'AppCanvas',

  data() {
    return {
      elements: [{
        id: 1,
        icon: 'ele-001.jpeg',
        title: '比卡丘',
      }, {
        id: 2,
        icon: 'ele-002.png',
        title: '小火龙',
      }, {
        id: 3,
        icon: 'ele-003.jpeg',
        title: '杰尼龟',
      }, {
        id: 4,
        icon: 'ele-004.jpg',
        title: '妙蛙种子',
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
      height: 90vh;
      background: url('../assets/images/grid.gif');
      cursor: default;
    }
    .tool-bar {
      background: #eee;
      padding-left: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
  }
  &__right {
    padding: 20px 20px 0 0;
    #graphOutline {
      border-radius: 4px;
      border: 1px solid #e6e6e6;
    }
    .elements {
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      .element {
        width: 100px;
        text-align: center;
        margin-bottom: 10px;
        > img {
          cursor: pointer;
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
