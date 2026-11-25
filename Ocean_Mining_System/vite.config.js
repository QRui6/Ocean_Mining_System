import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import cesium from 'vite-plugin-cesium';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const backendTarget = env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:8082';
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
          '/api/mining-overview': {
            target: env.VITE_MINING_OVERVIEW_PROXY_TARGET || backendTarget,
            changeOrigin: true,
            secure: false,
            timeout: 30000
          },
          '/api/historical-': { target: backendTarget, changeOrigin: true, timeout: 180000, proxyTimeout: 180000 },
          '/api/buoys': {
            target: backendTarget,
            changeOrigin: true,
            secure: false,
            timeout: 60000
          },
          // 代理所有其他/api请求到后端
          '/api': {
            target: backendTarget,
            changeOrigin: true,
            secure: false,
            timeout: 30000
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
