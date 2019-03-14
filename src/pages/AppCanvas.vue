<template>
  <ElContainer
    class="app-canvas">
    <ElMain
      class="app-canvas__main">
      <div
        class="tool-bar">
        <input
          @change="readFile"
          ref="importInput"
          class="hide"
          type="file">
        <ElButton
          type="text"
          size="mini"
          @click="importFile">
          导入
        </ElButton>
        <ElButton
          @click="exportFile"
          type="text"
          size="mini">
          导出
        </ElButton>
        <ElButton
          @click="logXML"
          type="text"
          size="mini">
          输出XML
        </ElButton>
        <ElButton
          type="text"
          size="mini"
          @click="del"
          :disabled="_.isEmpty(selectVertex) && _.isEmpty(selectEdge)">
          删除
        </ElButton>
        <ElButton
          @click="exportPic"
          type="text"
          size="mini">
          导出图片
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
          :value="selectVertex.data.normalType"
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
      <Panel
        class="element-panel"
        title="元素">
        <section>
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
        </section>
      </Panel>
      <EdgePanel
        v-if="!_.isEmpty(this.selectEdgeStyle)"
        :width="selectEdgeStyle.strokeWidth"
        :dashed="selectEdgeStyle.dashed"
        :color="selectEdgeStyle.strokeColor"
        :handle-style-change="ChangeEdgeStyle"/>
    </ElAside>
    <div
      class="outline-wrapper">
      <h4>导航器</h4>
      <div
        id="graphOutline"/>
    </div>
  </ElContainer>
</template>

<script>
import FileSaver from 'file-saver';
import Panel from 'components/Panel';
import mxgraph from '../graph/index';
import { genGraph, destroyGraph, Graph } from '../graph/Graph';
import EdgePanel from './components/EdgePanel';
import { elements, normalTypeOptions } from '../common/data';

const {
  mxGraph,
  mxOutline,
  mxEvent,
  mxCell,
  mxGeometry,
  mxUtils,
  mxEventObject,
  mxConnectionHandler,
} = mxgraph;

Object.assign(mxEvent, {
  NORMAL_TYPE_CLICKED: 'NORMAL_TYPE_CLICKED',
});

let graph = null;
let outline = null;
let idSeed = 0;

const insertVertex = (dom, target, x, y) => {
  const src = dom.getAttribute('src');
  const id = Number(dom.getAttribute('id'));
  const nodeRootVertex = new mxCell('鼠标双击输入', new mxGeometry(0, 0, 100, 135), `node;image=${src}`);
  nodeRootVertex.vertex = true;
  // 自定义的业务数据放在 data 属性
  idSeed++;
  nodeRootVertex.data = {
    id: idSeed,
    element: elements.find((element) => element.id === id),
    normalType: '',
  };

  const title = dom.getAttribute('alt');
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
    insertVertex(this.element, target, x, y);
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

const setCursor = () => {
  const oldGetCursorForCell = mxGraph.prototype.getCursorForCell;
  graph.getCursorForCell = function (...args) {
    const [cell] = args;
    return cell.style.includes('normalType') ?
      'pointer' :
      oldGetCursorForCell.apply(this, args);
  };
};

const setConnectValidation = () => {
  // 连接边校验
  mxGraph.prototype.isValidConnection = (source, target) => {
    const sourceElementId = source.data.element.id;
    const targetElementId = target.data.element.id;
    // 如果源点是智爷，终点必须是 皮卡丘 或 我是皮卡丘的超级超级进化
    if (sourceElementId === 1) {
      return targetElementId === 2 || targetElementId === 3;
    }

    // 如果终点是智爷同理
    if (targetElementId === 1) {
      return sourceElementId === 2 || sourceElementId === 3;
    }

    return true;
  };
};

const initGraph = () => {
  graph = genGraph(document.getElementById('graphContainer'));
  outline = new mxOutline(graph, document.getElementById('graphOutline'));
  // 将外元素拖拽进画布参考这个例子
  // https://github.com/jinzhanye/mxgraph-demos/blob/master/src/07.drag.html
  makeDraggable(document.getElementsByClassName('element-img'));
  listenGraphEvent();
  setCursor();
  setConnectValidation();
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
      normalTypeOptions,
      elements,
      selectEdge: {},
      selectVertex: {},
    };
  },

  components: {
    Panel,
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
    exportPic() {
      const data = graph.exportPicXML();
      console.log(data);
      // 发送 data 到服务端 ....
      // 服务端如果是使用 Java 可以参考官方这例子
      // https://github.com/jgraph/mxgraph/blob/master/java/test/com/mxgraph/test/mxImageExportTest.java
    },
    logXML() {
      this.$message.info('已经输出，请在控制台查看');
      const xml = graph.exportModelXML();
      console.log(xml);
      console.log('mode:', graph.getModel());
    },
    //*******
    // File
    //*******
    // 导出、导入功能参考这个例子
    // https://github.com/jgraph/mxgraph/blob/master/javascript/examples/fileio.html
    exportFile() {
      const xml = graph.exportModelXML();
      const blob = new Blob([xml], { type: "text/plain;charset=utf-8" });
      FileSaver.saveAs(blob, "pocket_monster.xml");
    },
    readFile(evt) {
      const file = evt.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const txt = e.target.result;
        graph.importModelXML(txt);
      };
      reader.readAsText(file);
    },
    importFile() {
      this.$refs.importInput.click();
    },
    //
    del() {
      if (!_.isEmpty(this.selectVertex)) {
        graph.deleteSubtree(this.selectVertex);
      } else {
        graph.removeCells([this.selectEdge]);
      }
    },
    //
    ChangeEdgeStyle(key, value) {
      graph.setStyle(this.selectEdge, key, value);
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

      // 另一种获取当前节点的方法
      // const selectionCell = graph.getSelectionCell();
      // console.log(selectionCell === cell); // true

      if (cell.vertex) {
        this.selectVertex = cell;
      } else {
        this.selectEdge = cell;
      }
    },
    _listenEvent() {
      // 监听自定义事件
      graph.addListener(mxEvent.NORMAL_TYPE_CLICKED, this.showNormalTypeSelect);
      graph.addListener(mxEvent.VERTEX_START_MOVE, this.hideTypeSelect);


      // 监听 mxGraph 事件
      const mxGraphSelectionModel = graph.getSelectionModel();
      mxGraphSelectionModel.addListener(mxEvent.CHANGE, this.handleSelectionChange);

      const vm = this;
      graph.addListener(mxEvent.MOVE_CELLS, (sender, evt) => {
        const cell = evt.properties.cells[0];
        const position = Graph.getCellPosition(cell);
        setTimeout(() => {
          vm.$message.info(`节点被移动到 ${JSON.stringify(position)}`);
        }, 1000);
      });

      graph.addListener(mxEvent.CELLS_ADDED, (sender, evt) => {
        const cell = evt.properties.cells[0];
        if (graph.isPart(cell)) {
          return;
        }

        if (cell.vertex) {
          this.$message.info('添加了一个节点');
        } else if (cell.edge) {
          this.$message.info('添加了一条线');
        }
      });

      graph.addListener(mxEvent.LABEL_CHANGED, (sender, evt) => {
        vm.$message.info(`内容改变为：${evt.getProperty('value')}`);
      });

      graph.addListener(mxEvent.CONNECT_CELL, (sender, evt) => {
        vm.$message.info(`改变了连线`);
      });
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
@import "../assets/style/module/util";

.app-canvas {
  #graphContainer {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 90vh;
    background: #eee url('../assets/images/grid.gif') 0 0 repeat;
    border-radius: 4px;
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
    position: relative;
    padding: 20px 20px 0 0;
    .element-panel {
      margin-top: -9px;
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
          border-radius: 4px;
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

  .outline-wrapper {
    border: 1px solid #dedede;
    background: #fff;
    position: fixed;
    right: 262px;
    top: 66px;
    border-radius: 4px;
    z-index: 10;
    > h4 {
      padding: 6px;
      font-size: 12px;
      border-bottom: 1px solid #e6e6e6;
    }
    #graphOutline {
      width: 200px;
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
