todo 添加一张截图

本项目是作为 xxx 的实战教学项目，使用 mxGraph、Vue 做一个宠物小精灵人物展示图谱

## 运行

``` bash
# 安装依赖
npm install

# 启动
npm start

# 访问
http://localhost:7777
```

## 功能

- 从面板拖拽元素加入到画布
- 在节点上修改属性、名称
- 在右侧面板修改线条样式，包括线形、粗细、颜色
- 删除线条、节点级联删除
- 导出、导入图形
- 自动布局
- 导航器
- 节点连接校验，规定“智爷”节点只能与“皮卡超”节点连接
- 导出 PNG（仅提供前端代码与后台代码）

## 常用 API
_configCustomEvent

```js
    handleNormalTypeClick(sender, evt) {
      const NormalTypeVertex = evt.getProperty('cell');
      const state = graph.view.getState(NormalTypeVertex);
      const dom = state.shape.node;
    }
```

靠谱的站点

https://forum.jgraph.com/vote/552/down/index.html
