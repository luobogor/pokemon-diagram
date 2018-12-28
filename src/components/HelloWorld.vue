<template>
  <div id="graphContainer"></div>
</template>

<script>
import mx from 'mxgraph';

const mxgraph = mx({
  mxBasePath: '/static/mxgraph'
});

const {
  mxConstants,
  mxCellState,
  mxConstraintHandler,
  mxConnectionConstraint,
  mxEdgeHandler,
  mxEvent,
  mxGraph,
  mxImage,
  mxPoint,
  mxRubberband,
  mxShape,
} = mxgraph;


export default {
  name: 'HelloWorld',
  methods: {
    test(container) {
      // 禁用鼠标右键
      mxEvent.disableContextMenu(container);
      // Replaces the port image
      mxConstraintHandler.prototype.pointImage = new mxImage('/static/mxgraph/images/dot.gif', 10, 10);
      const graph = new mxGraph(container);
      graph.setConnectable(true);
      // ????
      // Disables automatic handling of ports. This disables the reset of the
      // respective style in mxGraph.cellConnected. Note that this feature may
      // be useful if floating and fixed connections are combined.
      graph.setPortsEnabled(false);

      // Connect preview
      // 拖拽过程出现折线预览
      graph.connectionHandler.createEdgeState = function (me) {
        const edge = graph.createEdge(null, null, null, null, null, 'edgeStyle=orthogonalEdgeStyle');
        return new mxCellState(this.graph.view, edge, this.graph.getCellStyle(edge));
      };

      // 开启区域选择
      new mxRubberband(graph);
      // 禁止从图形中心拉出线条
      graph.connectionHandler.isConnectableCell = () => false;
      // 90度正交连线样式
      graph.getStylesheet().getDefaultEdgeStyle()['edgeStyle'] = 'orthogonalEdgeStyle';

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

      const parent = graph.getDefaultParent();
      graph.getModel().beginUpdate();
      try {
        graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
        graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
      } finally {
        graph.getModel().endUpdate();
      }
    }
  },
  mounted() {
    this.test(document.getElementById('graphContainer'));
  }
}
</script>

<style>
  #graphContainer {
    position: relative;
    overflow: hidden;
    width: 100vh;
    height: 80vh;
    background: url('../assets/grid.gif');
    cursor: default;
  }
</style>
