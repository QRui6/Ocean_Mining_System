import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import cesium from 'vite-plugin-cesium';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        strictPort: false,
        allowedHosts: [
          '.trycloudflare.com',
          '.ngrok-free.dev',
          '.ngrok.io'
        ],
        proxy: {
          '/api/shipxy': {
            target: 'https://api.shipxy.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/shipxy/, ''),
            secure: false,
            timeout: 30000
          },
          // 代理后端API请求
          '/api/backend': {
            target: 'http://localhost:8081',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/backend/, ''),
            secure: false
          }
        },
        fs: {
          // 允许访问项目根目录的文件
          allow: ['..']
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
      },
      // 配置静态资源处理
      publicDir: 'public',
      assetsInclude: ['**/*.bin']
    };
});
