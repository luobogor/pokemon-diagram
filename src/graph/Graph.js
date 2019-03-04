import mxgraph from './index';

const { mxGraph } = mxgraph;

class Graph extends mxGraph {
}

let graph = {};

export const destroyGraph = () => {
  graph.destroy();
  graph = {};
};

export const genGraph = (container) => {
  graph = new Graph(container);
  return graph;
};

export const getGraph = () => graph;
