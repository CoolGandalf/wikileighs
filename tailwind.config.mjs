/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Linux Libertine"', '"Georgia"', '"Times New Roman"', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        wiki: {
          link: '#3366cc',
          visited: '#795cb2',
          text: '#202122',
          muted: '#54595d',
          border: '#a2a9b1',
          infobox: '#f8f9fa',
          rail: '#eaecf0',
          accent: '#6b46c1',
        },
      },
    },
  },
  plugins: [],
};
