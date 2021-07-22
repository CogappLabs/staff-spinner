import Vue from "vue";
import App from "./App.vue";

Vue.config.productionTip = true;

new Vue({
  el: "#app",
  render: (h) => h(App),
}).$mount();
