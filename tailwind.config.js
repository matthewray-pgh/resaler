/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          900: "#0B0E15",
          800: "#111420",
          700: "#171B2A",
          600: "#1F2436",
          500: "#252B3D",
        },
        accent: {
          blue:   "#3B82F6",
          green:  "#10B981",
          amber:  "#F59E0B",
          red:    "#EF4444",
          purple: "#8B5CF6",
        },
      },
    },
  },
  plugins: [],
};
