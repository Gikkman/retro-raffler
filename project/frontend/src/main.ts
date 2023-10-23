import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

createApp(App).mount("#app");

if ([1, 2, 3].includes(1)) {
  console.log("a");
}
