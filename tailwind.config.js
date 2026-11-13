/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 覆盖默认颜色，使用更亮的色调
        cyan: {
          50: '#e0f7ff',
          100: '#b3ecff',
          200: '#80e0ff',
          300: '#4dd4ff',
          400: '#00d4ff',  // 主要高亮色（更亮）
          500: '#00b8e6',
          600: '#009acc',
          700: '#007db3',
          800: '#006099',
          900: '#004d80',
        },
        blue: {
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80c0ff',
          300: '#4da7ff',
          400: '#1e90ff',  // 亮蓝色
          500: '#0080ff',
          600: '#0070e6',
          700: '#0060cc',
          800: '#0050b3',
          900: '#004099',
        },
        yellow: {
          50: '#fffde7',
          100: '#fff9c4',
          200: '#fff59d',
          300: '#fff176',
          400: '#ffd700',  // 亮黄色（金色）
          500: '#ffc107',
          600: '#ffb300',
          700: '#ffa000',
          800: '#ff8f00',
          900: '#ff6f00',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',  // 深色背景
          900: '#0f172a',  // 更深的背景
          950: '#0a1628',  // 最深的背景（新增）
        },
        // 新增专用颜色
        'primary-bg': '#0a1628',
        'secondary-bg': '#0d1b2a',
        'panel-bg': 'rgba(13, 27, 42, 0.85)',
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(0, 212, 255, 0.4)',
        'cyan-glow-lg': '0 0 40px rgba(0, 212, 255, 0.5)',
        'blue-glow': '0 0 15px rgba(30, 144, 255, 0.3)',
        'yellow-glow': '0 0 15px rgba(255, 215, 0, 0.4)',
        'pink-glow': '0 0 15px rgba(255, 20, 147, 0.4)',
        'green-glow': '0 0 15px rgba(0, 255, 136, 0.4)',
      },
      backgroundColor: {
        'primary': '#0a1628',
        'secondary': '#0d1b2a',
      },
      borderColor: {
        'primary': 'rgba(0, 212, 255, 0.5)',
        'secondary': 'rgba(30, 144, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
