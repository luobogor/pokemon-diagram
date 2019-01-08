import _ from 'lodash';
import mx from 'mxgraph';

const mxgraph = mx({
  mxBasePath: '/static/mxgraph'
});

const {
  mxGraph,
} = mxgraph;

const getNodeId = _.property('data.id');

class Graph extends mxGraph {
  serializeEdges() {
    this.getModel().cells
      .filter(cell => cell.edge)
      .map(cell => {
        Object.assign(_.pick(cell, ['value', 'style']), {
          sourceId: getNodeId(cell.source),
          targetId: getNodeId(cell.target),
        });
      });
  }

  serializeVerticles() {
    this.getModel().cells
      .filter(cell => cell.vertex && !this.isPart(cell))
      .map(cell => cell.data);
  }

  isReachable(source, target) {

  }
}

export default mxgraph;
