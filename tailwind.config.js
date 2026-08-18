/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Times New Roman', 'serif'],
        label: ['Anton', 'sans-serif'],
        body: ['"DM Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        ink: '#1b0b09',
        cream: '#fdfbf4',
        gold: '#b8a508',
        line: '#e8e0cc',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.1)',
        modal: '0 20px 60px -10px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
}
