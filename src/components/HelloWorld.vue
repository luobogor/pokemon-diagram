<template>
  <div id="graphContainer"></div>
</template>

<script>
import mx from 'mxgraph';

const mxgraph = mx({
  mxBasePath: '/static/mxgraph'
});

const {
  mxGraph,
  mxEvent,
  mxRubberband,
} = mxgraph;

export default {
  name: 'HelloWorld',
  methods: {
    test(container) {
      // 禁用鼠标右键
      mxEvent.disableContextMenu(container);
      const graph = new mxGraph(container);
      // 开启区域选择
      new mxRubberband(graph);
      const parent = graph.getDefaultParent();
      graph.getModel().beginUpdate();
      try {
        const v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
        const v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
        const e1 = graph.insertEdge(parent, null, '30%', v1, v2);
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
    width: 500px;
    height: 500px;
    background: url('../assets/grid.gif');
    cursor: default;
  }
</style>
