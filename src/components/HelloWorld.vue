<template>
  <ElContainer>
    <ElMain>
      <div id="graphContainer"></div>
      <ElSelect
        v-show="showSelector"
        class="icon-selector"
        :value="selectIcon"
        @input="handleSelectIcon">
        <ElOption
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </ElOption>
      </ElSelect>
      <ElButton @click="exportXML">View XML</ElButton>
    </ElMain>
    <ElAside width="400px" style="padding-right: 20px;">
      <div id="graphOutline"></div>
      <div class="element-panel">
        <div style="text-align: center;cursor: pointer"
             v-for="(element,idx) in elements"
             :key="idx">
          <img
            v-bind="element"
            class="element-img"
            :src="'/static/'+element.icon"
            alt="element">
          <p>{{ element.name }}</p>
        </div>
      </div>
    </ElAside>
  </ElContainer>
</template>

<script>
import mx from 'mxgraph';

const mxgraph = mx({
  mxBasePath: '/static/mxgraph'
});

const {
  mxCell,
  mxCellOverlay,
  mxConstants,
  mxCellState,
  mxConstraintHandler,
  mxConnectionConstraint,
  mxCodec,
  mxEdgeHandler,
  mxEvent,
  mxGeometry,
  mxGraph,
  mxGraphHandler,
  mxImage,
  mxOutline,
  mxPerimeter,
  mxPoint,
  mxRubberband,
  mxShape,
  mxUtils,
  mxEdgeStyle,
} = mxgraph;


/**
 * Redirects start drag to parent.
 */
const graphHandlerGetInitialCellForEvent = mxGraphHandler.prototype.getInitialCellForEvent;
mxGraphHandler.prototype.getInitialCellForEvent = function (me) {
  let cell = graphHandlerGetInitialCellForEvent.apply(this, arguments);

  if (this.graph.isPart(cell)) {
    cell = this.graph.getModel().getParent(cell)
  }

  return cell;
};

function configConstituent(graph) {
  // Helper method to mark parts with constituent=1 in the style
  graph.isPart = function (cell) {
    var state = this.view.getState(cell);
    var style = (state != null) ? state.style : this.getCellStyle(cell);
    return style['constituent'] == '1';
  };
  // Redirects selection to parent
  graph.selectCellForEvent = function (cell) {
    if (this.isPart(cell)) {
      cell = this.model.getParent(cell);
    }

    mxGraph.prototype.selectCellForEvent.apply(this, arguments);
  };
}

export default {
  name: 'HelloWorld',

  data() {
    return {
      graph: {},
      showSelector: false,
      selectIcon: '',
      activeCell: {},
      options: [{
        value: 'icon-001.png',
        label: '牛',
      }, {
        value: 'icon-002.png',
        label: '狮',
      }, {
        value: 'icon-003.png',
        label: '虎',
      }],
      elements: [{
        icon: 'ele-001.jpg',
        name: 'pi ka qiu pi ka qiu',// 演示文本换行
      }, {
        icon: 'ele-002.jpeg',
        name: '也是比卡丘',
      }, {
        icon: 'ele-003.png',
        name: '小火龙',
      }]
    }
  },

  methods: {
    handleSelectIcon(icon) {
      this.graph.removeCellOverlays(this.activeCell);
      this.graph.addCellOverlay(this.activeCell, this.genOverlay(`/static/${icon}`));
      this.showSelector = false;
    },
    configOrthogonalEdge(graph) {
      // 90度正交连线样式
      // graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] = 'orthogonalEdgeStyle';
      // const style = graph.getStylesheet().getDefaultEdgeStyle();
      // style[mxConstants.STYLE_ROUNDED] = true;
      // style[mxConstants.STYLE_STROKEWIDTH] = 3;
      // style[mxConstants.STYLE_EXIT_X] = 0.5; // center
      // style[mxConstants.STYLE_EXIT_Y] = 1.0; // bottom
      // style[mxConstants.STYLE_EXIT_PERIMETER] = 0; // disabled
      // style[mxConstants.STYLE_ENTRY_X] = 0.5; // center
      // style[mxConstants.STYLE_ENTRY_Y] = 0; // top
      // style[mxConstants.STYLE_ENTRY_PERIMETER] = 0; // disabled
      // // Disable the following for straight lines
      // style[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ORTHOGONAL;

      const style = graph.getStylesheet().getDefaultEdgeStyle();
      style[mxConstants.STYLE_ROUNDED] = true;
      style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
      graph.alternateEdgeStyle = 'elbow=vertical';

      // Connect preview
      // 拖拽过程出现折线预览
      graph.connectionHandler.createEdgeState = function (me) {
        const edge = graph.createEdge();
        return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge));
      };
    },
    configNodeStyle(graph) {
      const style = {
        [mxConstants.STYLE_SHAPE]: mxConstants.SHAPE_LABEL,
        [mxConstants.STYLE_PERIMETER]: mxPerimeter.RectanglePerimeter,
        [mxConstants.STYLE_ROUNDED]: true,
        [mxConstants.STYLE_ARCSIZE]: 6,// 设置圆角程度

        [mxConstants.STYLE_STROKECOLOR]: '#ebb862',
        [mxConstants.STYLE_FONTCOLOR]: '#333333',
        [mxConstants.STYLE_FILLCOLOR]: '#FFFFFF',
        [mxConstants.STYLE_LABEL_BACKGROUNDCOLOR]: '#e6e6e6',

        [mxConstants.STYLE_ALIGN]: mxConstants.ALIGN_CENTER,
        [mxConstants.STYLE_VERTICAL_ALIGN]: mxConstants.ALIGN_TOP,
        [mxConstants.STYLE_IMAGE_ALIGN]: mxConstants.ALIGN_CENTER,
        [mxConstants.STYLE_IMAGE_VERTICAL_ALIGN]: mxConstants.ALIGN_TOP,

        [mxConstants.STYLE_IMAGE]: 'images/other/pika.jpg',
        [mxConstants.STYLE_IMAGE_WIDTH]: '100',
        [mxConstants.STYLE_IMAGE_HEIGHT]: '100',
        [mxConstants.STYLE_SPACING_TOP]: '130', // 文字到顶部距离
        [mxConstants.STYLE_SPACING]: '8',
      };

      graph.getStylesheet().putCellStyle('node', style);
    },
    genOverlay(src) {
      const facOverlay = () => {
        return new mxCellOverlay(
          new mxImage(src, 20, 20),
          null,
          mxConstants.ALIGN_LEFT,
          mxConstants.ALIGN_TOP,
          new mxPoint(16, 16),
          'pointer');
      };

      const overlay = facOverlay();
      overlay.addListener(mxEvent.CLICK, (sender, evt) => {
        this.activeCell = evt.getProperty('cell');
        this.showSelector = true;
      });
      return overlay;
    },
    configDrag(graph) {
      // 判断drop是否有效
      const dropGraph = function (evt) {
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

      const addDrag = (ele) => {
        const vm = this;
        // drop成功后新建一个节点
        const dropSuccessCb = (graph, evt, target, x, y) => {
          // 这个作用域内 this 就是 ele 的包装对象
          const src = ele.getAttribute('src');
          const name = ele.getAttribute('name');
          const cell = new mxCell('Name', new mxGeometry(0, 0, 120, 165), `node;image=${src}`);
          cell.vertex = true;

          graph.insertVertex(cell, null, name, 0.15, 0.7, 80, 16, 'constituent=1;whiteSpace=wrap;strokeColor=none;fillColor=none;', true);

          graph.addCellOverlay(cell, vm.genOverlay('/static/icon-001.png'));
          const cells = graph.importCells([cell], x, y, target);
          if (cells != null && cells.length > 0) {
            graph.setSelectionCells(cells);
          }
        };

        // preview 修改查看 schema.html
        // 禁止编辑线段文本 查看 userobject
        mxUtils.makeDraggable(ele, dropGraph, dropSuccessCb, dragElt, null, null, graph.autoscroll, true);
      };

      // Creates the element that is being for the actual preview.
      const dragElt = document.createElement('div');
      dragElt.style.border = 'dashed black 1px';
      dragElt.style.width = '120px';
      dragElt.style.height = '40px';

      const elements = document.getElementsByClassName('element-img');
      Array.from(elements).forEach(addDrag);
    },
    exportXML() {
      const encoder = new mxCodec();
      const node = encoder.encode(this.graph.getModel());
      mxUtils.popup(mxUtils.getPrettyXml(node), true);
    },
    test(container) {
      // 禁用鼠标右键
      mxEvent.disableContextMenu(container);
      const graph = new mxGraph(container);
      this.graph = graph;
      graph.setConnectable(true);
      // Optional disabling of sizing
      graph.setCellsResizable(false);
      graph.setAllowLoops(false);
      graph.setDisconnectOnMove(false);
      graph.foldingEnabled = false;
      // 智能调整靶点位置
      mxGraphHandler.prototype.guidesEnabled = true;
      mxEdgeHandler.prototype.snapToTerminals = true;
      graph.setHtmlLabels(true);
      // Configures the graph contains to resize and
      // add a border at the bottom, right
      // graph.setResizeContainer(true);
      // graph.minimumContainerSize = new mxRectangle(0, 0, 500, 380);
      // graph.setBorder(60);
      // 开启区域选择
      new mxRubberband(graph);
      // 禁止从图形中心拉出线条
      graph.connectionHandler.isConnectableCell = () => false;
      // 鹰眼图
      new mxOutline(graph, document.getElementById('graphOutline'));

      configConstituent(graph);
      this.configNodeStyle(graph);
      this.configOrthogonalEdge(graph);
      this.configDrag(graph);
      this.listenEvent(graph);
      this.handleConnect(graph);
    },
    handleConnect(graph) {
      // graph.setAllowDanglingEdges(false);

      // 暂时当作添加edge事件使用
      graph.addEdge = function (edge, parent, source, target, index) {
        if (target == null) {
          return null;
        }

        this.model.beginUpdate();
        try {
          return mxGraph.prototype.addEdge.apply(this, arguments); // "supercall"
        } finally {
          this.model.endUpdate();
        }

        return null;
      };
    },
    listenEvent(graph) {
      graph.addListener(mxEvent.CELLS_MOVED, function (sender, evt) {
        console.log(evt.name);
      });
      // 当作改变edge锚点事件使用
      // 两个节点第一次连接线条时不会触发该事件
      // 以后每次更改线条锚点都会触发该事件
      graph.addListener(mxEvent.CONNECT_CELL, function (sender, evt) {
        console.log('mxEvent.CONNECT_CELL');
        const edge = evt.getProperty('edge');
        if (!edge.target || !edge.source) {
          graph.removeCells([edge])
        }
      });

      // 删除edge,node事件
      graph.addListener(mxEvent.CELLS_REMOVED, function (sender, evt) {
        console.log(evt.name);
      });

      // graph.addListener(mxEvent.CELL_CONNECTED, function (sender, evt) {});
      graph.addListener(mxEvent.ADD_CELLS, function (sender, evt) {
        console.log(evt.name);
      });

      graph.addListener(mxEvent.LABEL_CHANGED, function (sender, evt) {
        console.log(evt.name);
      });

      graph.addListener(mxEvent.START_EDITING, function (sender, evt) {
        console.log(evt.name);

      });
      graph.addListener(mxEvent.EDITING_STARTED, function (sender, evt) {
        console.log(evt.name);

      });
      graph.addListener(mxEvent.EDITING_STOPPED, function (sender, evt) {
        console.log(evt.name);
      });
    },
  },
  mounted() {
    // mxConstant 查看默认样式
    // 查看 Permission 例子设置允许操作
    // 查看 hovericons 例子鼠标悬浮,查看touchf、contexticons 激活节点布局, touch 还有手势放大缩小功能
    // 查看 second label 例子修改节点布局
    // preview 修改查看 schema.html
    // 禁止编辑线段文本 查看 userobject
    // pagebreaks.html resetview
    // mxClient 提供各种判断当前客户端环境的工具函数
    // state.secondLabel.wrap = true; 文本换行包裹
    this.test(document.getElementById('graphContainer'));
  }
}
</script>

<style scoped>
  #graphContainer {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 80vh;
    background: url('../assets/grid.gif');
    cursor: default;
  }

  #graphOutline {
    height: 300px;
    overflow: hidden;
    background: transparent;
    border: 1px solid #000;
  }

  .icon-selector {

  }

  .element-panel {
    display: flex;
    margin-top: 20px;
    justify-content: space-between;
  }

  .element-img {
    border-radius: 4px;
    border: 1px solid #ebb862;
    width: 100px;
    height: 100px;
  }
</style>
