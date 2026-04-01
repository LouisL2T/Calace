import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4ff",
          100: "#dbe4ff",
          200: "#bac8ff",
          300: "#91a7ff",
          400: "#748ffc",
          500: "#5c7cfa",
          600: "#4c6ef5",
          700: "#4263eb",
          800: "#3b5bdb",
          900: "#364fc7",
        },
        surface: {
          50: "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          300: "#dee2e6",
        },
      },
      animation: {
        "module-appear": "moduleAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "particle-burst": "particleBurst 0.8s ease-out",
      },
      keyframes: {
        moduleAppear: {
          "0%": { opacity: "0", transform: "scale(0.8) translateY(20px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        particleBurst: {
          "0%": { opacity: "1", transform: "scale(0)" },
          "100%": { opacity: "0", transform: "scale(2)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
