import { createApp } from 'vue';
import App from './App.vue';

// 导入字体
import '@fontsource/rajdhani/400.css';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import '@fontsource/noto-sans-sc/300.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';

// 导入样式
import './styles/index.css';

const app = createApp(App);
app.mount('#app');