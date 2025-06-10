// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // This line ensures Tailwind scans all JS/JSX files in src
    "./public/**/*.html", // Optional: If you have custom HTML files in public
  ],
  theme: {
    extend: {
      fontFamily: { // Add the Inter font family
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}