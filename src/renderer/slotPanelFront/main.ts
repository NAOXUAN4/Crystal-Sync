import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import '@xterm/xterm/css/xterm.css';

// import { provideFluentDesignSystem, fluentButton } from '@fluentui/web-components';

// // 注册 Fluent UI 组件系统
// provideFluentDesignSystem().register(fluentButton());

import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
