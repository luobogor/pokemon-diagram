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
  mxEdgeHandler,
  mxEvent,
  mxGeometry,
  mxGraph,
  mxImage,
  mxOutline,
  mxPerimeter,
  mxPoint,
  mxRubberband,
  mxShape,
  mxUtils,
} = mxgraph;


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
        name: '比卡丘',
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
    configPorts(graph) {
      // Replaces the port image
      mxConstraintHandler.prototype.pointImage = new mxImage('/static/mxgraph/images/dot.gif', 10, 10);
      // ????
      // Disables automatic handling of ports. This disables the reset of the
      // respective style in mxGraph.cellConnected. Note that this feature may
      // be useful if floating and fixed connections are combined.
      graph.setPortsEnabled(false);

      // Ports are equal for all shapes...
      const ports = [];
      // NOTE: Constraint is used later for orthogonal edge routing (currently ignored)
      ports['w'] = { x: 0, y: 0.5, perimeter: true, constraint: 'west' };
      ports['e'] = { x: 1, y: 0.5, perimeter: true, constraint: 'east' };
      ports['n'] = { x: 0.5, y: 0, perimeter: true, constraint: 'north' };
      ports['s'] = { x: 0.5, y: 1, perimeter: true, constraint: 'south' };
      ports['nw'] = { x: 0, y: 0, perimeter: true, constraint: 'north west' };
      ports['ne'] = { x: 1, y: 0, perimeter: true, constraint: 'north east' };
      ports['sw'] = { x: 0, y: 1, perimeter: true, constraint: 'south west' };
      ports['se'] = { x: 1, y: 1, perimeter: true, constraint: 'south east' };
      // 框架内部调用 vertex.shape.getPorts()
      mxShape.prototype.getPorts = () => ports;
      // Disables floating connections (only connections via ports allowed)
      graph.connectionHandler.isConnectableCell = () => false;
      mxEdgeHandler.prototype.isConnectableCell = (cell) => graph.connectionHandler.isConnectableCell(cell);

      // Disables existing port functionality ??
      graph.view.getTerminalPort = function (state, terminal, source) {
        return terminal;
      };

      // Returns all possible ports for a given terminal
      graph.getAllConnectionConstraints = function (terminal, source) {
        if (terminal != null && terminal.shape != null &&
          terminal.shape.stencil != null) {
          // for stencils with existing constraints...
          if (terminal.shape.stencil != null) {
            return terminal.shape.stencil.constraints;
          }
        } else if (terminal != null && this.model.isVertex(terminal.cell)) {
          if (terminal.shape != null) {
            const ports = terminal.shape.getPorts();
            const cstrs = [];

            for (var id in ports) {
              var port = ports[id];

              var cstr = new mxConnectionConstraint(new mxPoint(port.x, port.y), port.perimeter);
              cstr.id = id;
              cstrs.push(cstr);
            }

            return cstrs;
          }
        }

        return null;
      };

      // update 时调用
      // Sets the port for the given connection
      graph.setConnectionConstraint = function (edge, terminal, source, constraint) {
        if (constraint != null) { // 连线刚好连线到端点
          const key = (source) ? mxConstants.STYLE_SOURCE_PORT : mxConstants.STYLE_TARGET_PORT;

          if (constraint == null || constraint.id == null) {
            this.setCellStyles(key, null, [edge]);
          } else if (constraint.id != null) {
            this.setCellStyles(key, constraint.id, [edge]);
          }
        }
      };

      // endUpdate 时调用
      // Returns the port for the given connection
      graph.getConnectionConstraint = function (edge, terminal, source) {
        const key = (source) ? mxConstants.STYLE_SOURCE_PORT : mxConstants.STYLE_TARGET_PORT;
        const id = edge.style[key];

        if (id != null) {
          const c = new mxConnectionConstraint(null, null);
          c.id = id;

          return c;
        }

        return null;
      };

      // Returns the actual point for a port by redirecting the constraint to the port
      const graphGetConnectionPoint = graph.getConnectionPoint;
      graph.getConnectionPoint = function (vertex, constraint) {
        // constraint 是从 getConnectionConstraint 中获取
        if (constraint.id != null && vertex != null && vertex.shape != null) {
          const port = vertex.shape.getPorts()[constraint.id];

          if (port != null) {
            return graphGetConnectionPoint.call(
              this,
              vertex,
              new mxConnectionConstraint(new mxPoint(port.x, port.y), port.perimeter));
          }
        }

        return graphGetConnectionPoint.apply(this, arguments);
      };
    },
    configOrthogonalEdge(graph) {
      // 90度正交连线样式
      graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] = 'orthogonalEdgeStyle';
      // Connect preview
      // 拖拽过程出现折线预览
      graph.connectionHandler.createEdgeState = function (me) {
        const edge = graph.createEdge(null, null, null, null, null, 'edgeStyle=orthogonalEdgeStyle');
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
        [mxConstants.STYLE_SPACING_TOP]: '110',
        [mxConstants.STYLE_SPACING]: '8'
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
          const cell = new mxCell(name, new mxGeometry(0, 0, 120, 150), `node;image=${src}`);
          cell.vertex = true;
          graph.addCellOverlay(cell, vm.genOverlay('/static/icon-001.png'));
          const cells = graph.importCells([cell], x, y, target);
          if (cells != null && cells.length > 0) {
            graph.setSelectionCells(cells);
          }
        };

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
    test(container) {
      // 禁用鼠标右键
      mxEvent.disableContextMenu(container);
      const graph = new mxGraph(container);
      this.graph = graph;
      graph.setConnectable(true);
      // 开启区域选择
      new mxRubberband(graph);
      // 禁止从图形中心拉出线条
      graph.connectionHandler.isConnectableCell = () => false;
      // 鹰眼图
      new mxOutline(graph, document.getElementById('graphOutline'));

      this.configPorts(graph);
      this.configNodeStyle(graph);
      this.configOrthogonalEdge(graph);
      this.configDrag(graph);
    }
  },
  mounted() {
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
