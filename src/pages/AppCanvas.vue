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
      <div id="graphContainer">
        <ElSelect
          v-if="normalTypeSelectVisible"
          class="normal-type-select"
          :style="{
          top:normalTypePosition.top,
          left:normalTypePosition.left
          }"
          v-model="normalType"
          @input="changeNormalType">
          <ElOption
            v-for="item in normalTypeOptions"
            :key="item.label"
            :label="item.label"
            :value="item.icon">
            <div
              class="normal-type-item">
              <img
                :src="`/static/images/normal-type/${item.icon}`"
                :alt="item.icon">
              <span
                class="ml8">{{ item.label }}</span>
            </div>
          </ElOption>
        </ElSelect>
      </div>
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
      <EdgePanel
        v-if="!_.isEmpty(this.selectEdgeStyle)"
        :width="selectEdgeStyle.strokeWidth"
        :dashed="selectEdgeStyle.dashed"
        :color="selectEdgeStyle.strokeColor"
        :handle-width-change="changeEdgeWidth"
        :handle-style-change="ChangeEdgeStyle"
        :handle-color-change="ChangeEdgeColor"/>
    </ElAside>
  </ElContainer>
</template>

<script>
import mxgraph from '../graph/index';
import { genGraph, destroyGraph } from '../graph/Graph';
import EdgePanel from './components/EdgePanel';
import { elements, normalTypeOptions } from '../common/data';

const {
  mxOutline,
  mxEvent,
  mxCell,
  mxGeometry,
  mxUtils,
  mxEventObject,
} = mxgraph;

Object.assign(mxEvent, {
  NORMAL_TYPE_CLICKED: 'NORMAL_TYPE_CLICKED',
});

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
    const id = Number(source.getAttribute('id'));

    const nodeRootVertex = new mxCell('Name', new mxGeometry(0, 0, 100, 135), `node;image=${src}`);
    nodeRootVertex.vertex = true;
    // 初始化业务数据
    nodeRootVertex.data = {
      element: elements.find((element) => element.id === id),
      normalType: '',
    };

    const title = source.getAttribute('alt');
    const titleVertex = graph.insertVertex(nodeRootVertex, null, title,
      0.1, 0.65, 80, 16,
      'constituent=1;whiteSpace=wrap;strokeColor=none;fillColor=none;fontColor=#e6a23c',
      true);
    titleVertex.setConnectable(false);

    const normalTypeVertex = graph.insertVertex(nodeRootVertex, null, null,
      0.05, 0.05, 19, 14,
      `normalType;constituent=1;fillColor=none;image=/static/images/normal-type/forest.png`,
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

const listenGraphEvent = () => {
  graph.addListener(mxEvent.CLICK, (sender, evt) => {
    const cell = evt.properties.cell;
    if (!cell) {
      return;
    }

    const clickNormalType = cell.style.includes('normalType');
    if (clickNormalType) {
      // 使用 mxGraph 事件中心，触发自定义事件
      graph.fireEvent(new mxEventObject(mxEvent.NORMAL_TYPE_CLICKED, 'cell', cell));
    }
  });
};

const initGraph = () => {
  graph = genGraph(document.getElementById('graphContainer'));
  outline = new mxOutline(graph, document.getElementById('graphOutline'));
  makeDraggable(document.getElementsByClassName('element-img'));
  listenGraphEvent();
};


export default {
  name: 'AppCanvas',

  data() {
    return {
      normalTypeSelectVisible: false,
      normalTypePosition: {
        top: '0',
        left: '0',
      },
      normalType: '',
      normalTypeOptions,
      elements,
      selectEdge: {},
      selectVertex: {},
    };
  },

  components: {
    EdgePanel,
  },

  computed: {
    selectEdgeStyle() {
      if (!_.isEmpty(this.selectEdge)) {
        return graph.getCellStyle(this.selectEdge);
      }
      return {};
    }
  },

  methods: {
    //************
    // EdgeStyle
    //************
    changeEdgeWidth(val) {
      graph.setStyle(this.selectEdge, 'strokeWidth', val);
    },
    ChangeEdgeStyle(dashed) {
      graph.setStyle(this.selectEdge, 'dashed', dashed);
    },
    ChangeEdgeColor(val) {
      graph.setStyle(this.selectEdge, 'strokeColor', val);
    },
    //************
    // NormalType
    //************
    changeNormalType(val) {
      this.selectVertex.data.normalType = val;
      const normalTypeVertex = this.selectVertex.children[1];
      graph.setStyle(normalTypeVertex, 'image', `/static/images/normal-type/${val}`);
      this.hideTypeSelect();
    },
    hideTypeSelect() {
      this.normalTypeSelectVisible = false;
    },
    showNormalTypeSelect(sender, evt) {
      const normalTypeDom = graph.getDom(evt.getProperty('cell'));
      const { left, top } = normalTypeDom.getBoundingClientRect();
      this.normalTypePosition.left = `${left - 210}px`;
      this.normalTypePosition.top = `${top - 8}px`;
      this.normalTypeSelectVisible = true;
    },

    handleSelectionChange(selectModel) {
      this.selectVertex = {};
      this.selectEdge = {};
      if (!selectModel.cells.length) {
        return;
      }

      const cell = selectModel.cells[0];
      if (cell.vertex) {
        this.selectVertex = cell;
      } else {
        this.selectEdge = cell;
      }
    },
    _listenEvent() {
      // TODO 为什么 change 事件如果使用箭头函数 this 竟然是 selectModel 而不是 vm
      graph.getSelectionModel().addListener(mxEvent.CHANGE, this.handleSelectionChange);
      graph.addListener(mxEvent.NORMAL_TYPE_CLICKED, this.showNormalTypeSelect);
      graph.addListener(mxEvent.VERTEX_START_MOVE, this.hideTypeSelect);
    }
  },

  mounted() {
    initGraph();
    this._listenEvent();
  },

  beforeDestroy() {
    destroyGraph();
  }
}
</script>

<style lang="less" scoped>
.app-canvas {
  #graphContainer {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 90vh;
    background: url('../assets/images/grid.gif');
    cursor: default;
  }
  &__main {
    .tool-bar {
      background: #eee;
      padding-left: 10px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .normal-type-select {
      position: fixed;
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

<style lang="less">
.normal-type-item {
  display: flex;
  align-items: center;
  & > img {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }
}
</style>
