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
          :value="item.overlayId">
        </ElOption>
      </ElSelect>
      <ElButton @click="exportXML">View XML</ElButton>
      <ElButton @click="exportJSON">View JSON</ElButton>
      <ElButton @click="autoLayout">Auto Layout</ElButton>
    </ElMain>
    <ElAside width="400px" style="padding-right: 20px;">
      <div id="graphOutline" class="graphOutline"></div>
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
import _ from 'lodash';

const mxgraph = mx({
  mxBasePath: '/static/mxgraph'
});

const {
  mxCell,
  mxCellOverlay,
  mxConstants,
  mxConstraintHandler,
  mxConnectionConstraint,
  mxCellState,
  mxConnectionHandler,
  mxCodec,
  mxEdgeHandler,
  mxEvent,
  mxHierarchicalLayout,
  mxGeometry,
  mxGraph,
  mxGraphHandler,
  mxImage,
  mxMorphing,
  mxOutline,
  mxPerimeter,
  mxPoint,
  mxRectangle,
  mxShape,
  mxUtils,
  mxPolyline,
  mxEdgeStyle,
} = mxgraph;


let graph = null;
let layout = null;
let outline = null;

function configPorts() {
  // Replaces the port image
  // 可选样式 images/handle-main.png
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
}

class mxIconSet {
  constructor(state) {
    this.images = [];
    const graph = state.view.graph;
    const arrowTop = mxUtils.createImage('/static/arrow.png');
    arrowTop.setAttribute('title', 'NewEdge');
    arrowTop.style.position = 'absolute';
    arrowTop.style.cursor = 'pointer';
    arrowTop.style.width = '30px';
    arrowTop.style.height = '30px';
    arrowTop.style.left = (state.x + state.width / 2 - 15) + 'px';
    arrowTop.style.top = (state.y + state.height) + 10 + 'px';

    mxEvent.addGestureListeners(arrowTop,
      mxUtils.bind(this, function (evt) {
        const pt = mxUtils.convertPoint(graph.container,
          mxEvent.getClientX(evt), mxEvent.getClientY(evt));
        graph.connectionHandler.start(state, pt.x, pt.y);
        graph.isMouseDown = true;
        graph.isMouseTrigger = mxEvent.isMouseEvent(evt);
        mxEvent.consume(evt);
      })
    );
    state.view.graph.container.appendChild(arrowTop);
    this.images.push(arrowTop);
  }

  destroy() {
    this.images.forEach((img) => {
      img.parentNode.removeChild(img);
    });
    this.images = null;
  };
}

function configHoverIcon() {
  // mxConstants.DEFAULT_HOTSPOT = 0.1;
  // 使用 0 px 的图像覆盖原来的中心拖拽
  // mxConnectionHandler.prototype.connectImage = new mxImage('', 0, 0);
  mxEdgeHandler.prototype.snapToTerminals = true;

  // 悬浮热区大小
  const iconTolerance = 60;
  // Shows icons if the mouse is over a cell
  graph.addMouseListener({
    currentState: null,
    currentIconSet: null,
    mouseDown(sender, me) {
      // Hides icons on mouse down
      if (this.currentState != null) {
        this.dragLeave(me.getEvent(), this.currentState);
        this.currentState = null;
      }
    },
    mouseMove(sender, me) {
      if (this.currentState != null && (me.getState() == this.currentState ||
        me.getState() == null)) {
        const tol = iconTolerance;
        const tmp = new mxRectangle(me.getGraphX() - tol,
          me.getGraphY() - tol, 2 * tol, 2 * tol);

        if (mxUtils.intersects(tmp, this.currentState)) {
          return;
        }
      }

      let tmp = graph.view.getState(me.getCell());

      // Ignores everything but vertices
      if (graph.isMouseDown || (tmp != null && !graph.getModel().isVertex(tmp.cell))) {
        tmp = null;
      }

      if (tmp !== this.currentState) {
        if (tmp != null && graph.isPart(tmp.cell)) {
          return;
        }

        if (this.currentState != null) {
          this.dragLeave(me.getEvent(), this.currentState);
        }

        this.currentState = tmp;

        if (this.currentState != null) {
          this.dragEnter(me.getEvent(), this.currentState);
        }
      }
    },
    mouseUp(sender, me) {},
    dragEnter(evt, state) {
      if (this.currentIconSet == null) {
        this.currentIconSet = new mxIconSet(state);
      }
    },
    dragLeave(evt, state) {
      if (this.currentIconSet != null) {
        this.currentIconSet.destroy();
        this.currentIconSet = null;
      }
    },
  });
}

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

function configConstituent() {
  // Helper method to mark parts with constituent=1 in the style
  graph.isPart = function (cell) {
    const state = this.view.getState(cell);
    const style = (state != null) ? state.style : this.getCellStyle(cell);
    return style.constituent === 1;
  };
  // Redirects selection to parent
  graph.selectCellForEvent = function (cell, e) {
    if (this.isPart(cell)) {
      const parentCell = this.model.getParent(cell);
      mxGraph.prototype.selectCellForEvent.call(this, parentCell, e);
      return;
    }

    mxGraph.prototype.selectCellForEvent.apply(this, arguments);
  };
}

function configAutoLayout() {
  layout = new mxHierarchicalLayout(graph);
  mxHierarchicalLayout.prototype.disableEdgeStyle = false;
  mxHierarchicalLayout.prototype.edgeStyle = 3;
}

function configAnchors() {
  // Disables floating connections (only connections via ports allowed)
  graph.connectionHandler.isConnectableCell = () => false;
  mxEdgeHandler.prototype.isConnectableCell = (cell) => graph.connectionHandler.isConnectableCell(cell);

  // Overridden to define per-shape connection points
  mxGraph.prototype.getAllConnectionConstraints = function (terminal, source) {
    if (terminal != null && terminal.shape != null) {
      if (terminal.shape.stencil != null) {
        if (terminal.shape.stencil != null) {
          return terminal.shape.stencil.constraints;
        }
      }
      else if (terminal.shape.constraints != null) {
        return terminal.shape.constraints;
      }
    }

    return null;
  };

  // Defines the default constraints for all shapes
  mxShape.prototype.constraints = [new mxConnectionConstraint(new mxPoint(0.25, 0), true),
    new mxConnectionConstraint(new mxPoint(0.5, 0), true),
    new mxConnectionConstraint(new mxPoint(0.75, 0), true),
    new mxConnectionConstraint(new mxPoint(0, 0.25), true),
    new mxConnectionConstraint(new mxPoint(0, 0.5), true),
    new mxConnectionConstraint(new mxPoint(0, 0.75), true),
    new mxConnectionConstraint(new mxPoint(1, 0.25), true),
    new mxConnectionConstraint(new mxPoint(1, 0.5), true),
    new mxConnectionConstraint(new mxPoint(1, 0.75), true),
    new mxConnectionConstraint(new mxPoint(0.25, 1), true),
    new mxConnectionConstraint(new mxPoint(0.5, 1), true),
    new mxConnectionConstraint(new mxPoint(0.75, 1), true)];

  // Edges have no connection points
  mxPolyline.prototype.constraints = null;

}

function listenActiveEvent() {
  graph.getSelectionModel().addListener(mxEvent.CHANGE, (selectModel, e) => {
    if (!selectModel.cells.length) {
      return;
    }
    graph.orderCells(false, selectModel.cells);
  });
}

class Node {
  constructor(elementId, overlayId, name) {
    this.id = Date.now();
    this.name = name;
    this.elementId = Number(elementId);
    this.overlayId = Number(overlayId);
  }
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
        overlayId: 1,
        value: 'icon-001.png',
        label: '牛',
      }, {
        overlayId: 2,
        value: 'icon-002.png',
        label: '狮',
      }, {
        overlayId: 3,
        value: 'icon-003.png',
        label: '虎',
      }],
      elements: [{
        elementId: 1,
        icon: 'ele-001.jpg',
        name: 'pi ka qiu pi ka qiu',// 演示文本换行
      }, {
        elementId: 2,
        icon: 'ele-002.jpeg',
        name: '也是比卡丘',
      }, {
        elementId: 3,
        icon: 'ele-003.png',
        name: '小火龙',
      }]
    }
  },

  methods: {
    autoLayout() {
      const parent = graph.getDefaultParent();
      graph.getModel().beginUpdate();
      try {
        layout.execute(parent);
      } catch (e) {
        throw e;
      } finally {
        // 变形动画
        // Default values are 6, 1.5, 20
        const morph = new mxMorphing(graph, 10, 1.7, 20);
        morph.addListener(mxEvent.DONE, () => {
          graph.getModel().endUpdate();
        });
        morph.startAnimation();
      }
    },
    handleSelectIcon(id) {
      graph.removeCellOverlays(this.activeCell);
      graph.addCellOverlay(this.activeCell, this.genOverlay(`/static/icon-00${id}.png`));
      this.activeCell.data.overlayId = id;
      this.showSelector = false;
    },
    configOrthogonalEdge() {
      // 禁止拖动线条
      mxGraph.prototype.isCellMovable = cell => !cell.edge;

      const style = graph.getStylesheet().getDefaultEdgeStyle();
      style[mxConstants.STYLE_ROUNDED] = true;
      style[mxConstants.STYLE_STROKEWIDTH] = '2';
      style[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ORTHOGONAL;
      // style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
      // graph.alternateEdgeStyle = 'elbow=vertical';

      // Connect preview
      // 拖拽过程出现折线预览
      graph.connectionHandler.createEdgeState = function (me) {
        const edge = graph.createEdge();
        return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge));
      };
    },
    configNodeStyle() {
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
    configDrag() {
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

          const title = graph.insertVertex(cell, null, name, 0.15, 0.7, 80, 16, 'constituent=1;whiteSpace=wrap;', true);
          title.setConnectable(false);

          graph.addCellOverlay(cell, vm.genOverlay('/static/icon-001.png'));

          cell.data = new Node(ele.getAttribute('elementId'), 1, 'Name');

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
      const node = encoder.encode(graph.getModel());
      const model = graph.getModel();
      debugger;
      mxUtils.popup(mxUtils.getPrettyXml(node), true);
    },
    exportJSON() {
      const myModel = graph.getModel();
    },

    test(container) {
      // 禁用鼠标右键
      mxEvent.disableContextMenu(container);
      graph = new mxGraph(container);
      listenActiveEvent();
      graph.setConnectable(true);
      // Optional disabling of sizing
      graph.setCellsResizable(false);
      graph.setAllowLoops(false);
      // 禁止游离线条
      graph.setDisconnectOnMove(false);
      // 禁止调整线条弯曲度
      graph.setCellsBendable(false);

      graph.foldingEnabled = false;
      mxGraphHandler.prototype.guidesEnabled = true;

      graph.setHtmlLabels(true);
      // Configures the graph contains to resize and
      // add a border at the bottom, right
      // graph.setResizeContainer(true);
      // graph.minimumContainerSize = new mxRectangle(0, 0, 500, 380);
      // graph.setBorder(60);

      mxEdgeHandler.prototype.snapToTerminals = false;
      // miniMap
      outline = new mxOutline(graph, document.getElementById('graphOutline'));
      mxOutline.prototype.labelsVisible = true;
      mxOutline.prototype.updateOnPan = true;
      // configPorts();
      configAutoLayout();
      configAnchors();
      configHoverIcon();
      configConstituent();
      this.configNodeStyle();
      this.configOrthogonalEdge();
      this.configDrag();
      this.handleConnect();
      this.listenEvent();
    },
    handleConnect() {
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
    listenEvent() {
      graph.addListener(mxEvent.CELLS_MOVED, function (sender, evt) {
        console.log(evt.name);
      });
      // 当作改变edge锚点事件使用
      // 两个节点第一次连接线条时不会触发该事件
      // 以后每次更改线条锚点都会触发该事件
      graph.addListener(mxEvent.CONNECT_CELL, function (sender, evt) {
        const edge = evt.getProperty('edge');
        if (!edge.target || !edge.source) {
          graph.removeCells([edge])
        }
      });
      // 线条连接后将层级设置到最低
      graph.addListener(mxEvent.CELL_CONNECTED, (sender, e) => {
        const edge = e.getProperty('edge');
        console.log('mxEvent.CELL_CONNECTED');
        setTimeout(() => {
          graph.orderCells(true, [edge]);
        }, 0);
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

  .graphOutline {
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
