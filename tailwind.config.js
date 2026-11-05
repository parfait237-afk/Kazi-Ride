/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        kazi: { blue: '#0066FF', cyan: '#00D9FF', navy: '#001B4E', gold: '#FFD700', orange: '#FF9900' },
      },
    },
  },
  plugins: [],
};

