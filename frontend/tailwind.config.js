/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bahamian: {
          turquoise: '#18ddc4',
          yellow: '#ffea48',
          coral: '#ff6b6b',
          green: '#4ecdc4',
          orange: '#ff8c42',
          pink: '#ff6b9d',
        },
      },
    },
  },
  plugins: [],
}

