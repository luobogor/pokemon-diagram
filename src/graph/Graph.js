import mxgraph from './index';

const {
  mxGraph,
  mxVertexHandler,
  mxConstants,
  mxCellState,
  mxPerimeter,
  mxCellEditor,
  mxGraphHandler,
  mxEvent,
  mxEdgeHandler,
  mxShape,
  mxConnectionConstraint,
  mxPoint,
  mxPolyline,
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
    this._setDefaultVertexStyle();
    this._setDefaultEdgeStyle();
    this._setDefaultConfig();
    this._setAnchors();
  }

  _setDefaultConfig() {
    this.setConnectable(true);
    mxEvent.disableContextMenu(this.container);

    // 固定节点大小
    this.setCellsResizable(false);
    this.setAllowLoops(false);

    // 编辑时回车不换行，变成完成输入
    this.setEnterStopsCellEditing(true);
    // 按 escape 后完成输入
    mxCellEditor.prototype.escapeCancelsEditing = false;
    // 失焦时完成输入
    mxCellEditor.prototype.blurEnabled = true;

    // 禁止节点折叠
    this.foldingEnabled = false;
    // 文本包裹效果必须开启此配置
    this.setHtmlLabels(true);

    // 拖拽过程对齐线
    mxGraphHandler.prototype.guidesEnabled = true;

    // 禁止游离线条
    this.setDisconnectOnMove(false);
    this.setAllowDanglingEdges(false);
    mxGraph.prototype.isCellMovable = cell => !cell.edge;

    // 禁止调整线条弯曲度
    this.setCellsBendable(false);

    // 禁止从将label从线条上拖离
    mxGraph.prototype.edgeLabelsMovable = false;
  }

  _setDefaultVertexStyle() {
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

  _setAnchors() {
    // 禁止从节点中心拖拽出线条
    this.connectionHandler.isConnectableCell = () => false;
    mxEdgeHandler.prototype.isConnectableCell = () => false;

    // Overridden to define per-shape connection points
    mxGraph.prototype.getAllConnectionConstraints = (terminal) => {
      if (terminal != null && terminal.shape != null) {
        if (terminal.shape.stencil != null) {
          if (terminal.shape.stencil != null) {
            return terminal.shape.stencil.constraints;
          }
        } else if (terminal.shape.constraints != null) {
          return terminal.shape.constraints;
        }
      }

      return null;
    };

    // Defines the default constraints for all shapes
    mxShape.prototype.constraints = [
      new mxConnectionConstraint(new mxPoint(0, 0), true),
      new mxConnectionConstraint(new mxPoint(0, 1), true),
      new mxConnectionConstraint(new mxPoint(1, 0), true),
      new mxConnectionConstraint(new mxPoint(1, 1), true),
      new mxConnectionConstraint(new mxPoint(0.25, 0), true),
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
