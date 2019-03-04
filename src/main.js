import Vue from 'vue'
import AppCanvas from './pages/AppCanvas'
import ElementUI from 'element-ui';
import './assets/style/index.less';
import 'element-ui/lib/theme-chalk/index.css';

Vue.use(ElementUI);

Vue.config.productionTip = false;

new Vue({
  el: '#app',
  render: h => h(AppCanvas)
});
