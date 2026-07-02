/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 低保真主色：蓝色用于按钮/选中/标签/进度条
        brand: {
          DEFAULT: '#2563EB', // blue-600
          hover: '#1D4ED8',   // blue-700
          soft: '#DBEAFE',    // blue-100
          softer: '#EFF6FF',  // blue-50
          text: '#1E40AF',    // blue-800
        },
        // 灰阶 (wireframe 主色) —— 对齐 Tailwind gray，补全 400/600/800 档
        ink: {
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
          500: '#6B7280',
          400: '#9CA3AF',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
          50:  '#F9FAFB',
        },
      },
      fontFamily: {
        sans: [
          'PingFang SC',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'Microsoft YaHei',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(17, 24, 39, 0.04)',
      },
    },
  },
  plugins: [],
}
