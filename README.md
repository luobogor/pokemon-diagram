## 功能

- 在元素上修改属性、名称
- 线条修改样式
- 级联删除
- 导出、导入
- 自动布局
- 导航器

## 已知问题
- 颜色要用标准6位，不要用3位
- 左上边界搞不定

## 常用 API
_configCustomEvent

```js
    handleNormalTypeClick(sender, evt) {
      const NormalTypeVertex = evt.getProperty('cell');
      const state = graph.view.getState(NormalTypeVertex);
      const dom = state.shape.node;
    },
```

_configConstituent

setStyle

按功能点讲解

