import mxgraph from './index';

const {
  mxGraph,
  mxVertexHandler,
  mxConstants,
  mxCellState,
  mxPerimeter,
} = mxgraph;

class Graph extends mxGraph {
  constructor(container) {
    super(container);
    this._init();
  }

  _init() {
    this._setDefaultStyle();
  }

  _setDefaultStyle() {
    // TODO
    this.setHtmlLabels(true);
    this._setDefaultVertexStyle();
    this._setDefaultEdgeStyle();
  }

  _setDefaultVertexStyle() {
    this.foldingEnabled = false;

    const normalTypeStyle = {
      [mxConstants.STYLE_SHAPE]: mxConstants.SHAPE_IMAGE,
      [mxConstants.STYLE_PERIMETER]: mxPerimeter.RectanglePerimeter,
    };
    this.getStylesheet().putCellStyle('normalType', normalTypeStyle);

    const nodeStyle = {
      // TODO 标注在哪个 example 可以找到
      [mxConstants.STYLE_SHAPE]: mxConstants.SHAPE_LABEL,
      [mxConstants.STYLE_PERIMETER]: mxPerimeter.RectanglePerimeter,
      [mxConstants.STYLE_ROUNDED]: true,
      [mxConstants.STYLE_ARCSIZE]: 6, // 设置圆角程度

      [mxConstants.STYLE_STROKECOLOR]: '#333333',
      [mxConstants.STYLE_FONTCOLOR]: '#333333',
      [mxConstants.STYLE_FILLCOLOR]: '#ffffff',
      //
      [mxConstants.STYLE_LABEL_BACKGROUNDCOLOR]: 'none',

      [mxConstants.STYLE_ALIGN]: mxConstants.ALIGN_CENTER,
      [mxConstants.STYLE_VERTICAL_ALIGN]: mxConstants.ALIGN_TOP,
      [mxConstants.STYLE_IMAGE_ALIGN]: mxConstants.ALIGN_CENTER,
      [mxConstants.STYLE_IMAGE_VERTICAL_ALIGN]: mxConstants.ALIGN_TOP,

      [mxConstants.STYLE_IMAGE_WIDTH]: '72',
      [mxConstants.STYLE_IMAGE_HEIGHT]: '72',
      [mxConstants.STYLE_SPACING_TOP]: '105',
      [mxConstants.STYLE_SPACING]: '8',
    };
    this.getStylesheet().putCellStyle('node', nodeStyle);

    // 设置选中状态节点的边角为圆角，默认是直角
    const oldCreateSelectionShape = mxVertexHandler.prototype.createSelectionShape;
    mxVertexHandler.prototype.createSelectionShape = function createSelectionShape(...args) {
      const res = oldCreateSelectionShape.apply(this, args);
      res.isRounded = true;
      // style 属性来自 mxShape , mxRectangle 继承自 mxShape
      res.style = {
        arcSize: 6,
      };
      return res;
    };
  }

  _setDefaultEdgeStyle() {
    // mxGraph.prototype.edgeLabelsMovable = false;
    // mxGraph.prototype.isCellMovable = cell => !cell.edge;

    const style = this.getStylesheet().getDefaultEdgeStyle();
    Object.assign(style, {
      [mxConstants.STYLE_ROUNDED]: true,
      [mxConstants.STYLE_STROKEWIDTH]: '2',
      [mxConstants.STYLE_STROKECOLOR]: '#333333',
      [mxConstants.STYLE_EDGE]: mxConstants.EDGESTYLE_ORTHOGONAL,
      [mxConstants.STYLE_FONTCOLOR]: '#333333',
      [mxConstants.STYLE_LABEL_BACKGROUNDCOLOR]: '#ffffff',
    });
    // TODO 标注demo 出处
    // 设置拖拽线的过程出现折线，默认为直线
    this.connectionHandler.createEdgeState = () => {
      const edge = this.createEdge();
      return new mxCellState(this.view, edge, this.getCellStyle(edge));
    };
  }
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
