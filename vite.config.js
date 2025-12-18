import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import cesium from 'vite-plugin-cesium';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: 'localhost',
        strictPort: false,
        proxy: {
          '/api/shipxy': {
            target: 'https://api.shipxy.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/shipxy/, ''),
            secure: false,
            timeout: 30000  // 增加超时时间到30秒
          }
        }
      },
      plugins: [
        vue(),
        cesium()
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(import.meta.dirname || __dirname, './src'),
        }
      }
    };
});
