# Pokemon diagram

![](https://ws2.sinaimg.cn/large/006tKfTcgy1g12o6tm578j316j0pmgs4.jpg)

本项目作为[《mxGraph 入门实例教程》](https://yejinzhan.gitee.io/2019/04/27/mxGraph%20%E5%85%A5%E9%97%A8%E5%AE%9E%E4%BE%8B%E6%95%99%E7%A8%8B/)的实战教学项目，使用 mxGraph、Vue 做一个宠物小精灵人物展示图谱。

## 在线演示

[点我访问](http://www.yejinzhan.top)

## 运行

``` bash
# 安装依赖
npm install

# 启动
npm start

# 访问
http://localhost:7777
```

## 技术栈
- mxGraph
- Vue

## 功能
- 从面板拖拽元素加入到画布
- 节点可修改属性、名称
- 右侧面板修改线条样式，包括线形、粗细、颜色
- 删除线条、节点级联删除
- 导出、导入图形
- 导航器
- 节点连接校验，规定“智爷”只能与“皮卡超”或"我是皮卡丘的超级超级进化"连接
- 导出 PNG（仅提供前端代码）

注：本项目在 Chrome 下进行开发，并没有对其他浏览器做兼容处理。
