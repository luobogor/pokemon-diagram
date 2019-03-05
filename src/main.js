import Vue from 'vue'
import _ from 'lodash';
import AppCanvas from './pages/AppCanvas'
import ElementUI from 'element-ui';
import './assets/style/index.less';
import 'element-ui/lib/theme-chalk/index.css';

Vue.use(ElementUI);
Vue.prototype._ = _;

Vue.config.productionTip = false;

new Vue({
  el: '#app',
  render: h => h(AppCanvas)
});
