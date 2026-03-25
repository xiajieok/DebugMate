/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0B0F14",
        card: "#121821",
        border: "#1F2A37",
        "text-primary": "#E5E7EB",
        "text-secondary": "#9CA3AF",
        primary: "#6366F1",
        "primary-hover": "#4F46E5",
      },
    },
  },
  plugins: [],
};
