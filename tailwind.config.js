/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F6FCF9",
          100: "#D1F0E3",
          200: "#B2DFC5", // For dashed borders
          300: "#74D4A4",
          400: "#6EE5A8",
          500: "#3DB87A", // Main CTA
          600: "#2D6A4F",
          700: "#1A4D33",
          800: "#0D2E1C",
          900: "#0D2E1C",
        },
        text: {
          900: "#0D1117",
          500: "#4A5568",
          300: "#9AA3AF",
          primary: "#0D1117",
          secondary: "#4A5568",
          muted: "#9AA3AF",
          subtle: "#C0C8D2",
          inverse: "#FFFFFF",
        },
        background: {
          DEFAULT: "#F7F8FA",
          alt: "#F6FCF9",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F0F2F5",
          alt: "#F7F8FA",
        },
        border: {
          DEFAULT: "#E8EBF0",
          muted: "#F0F2F5",
        },
        warning: {
          DEFAULT: "#F5A623",
          light: "#FEF3E0",
          dark: "#C07800",
        },
        danger: {
          DEFAULT: "#E55C5C",
          light: "#FEE8E8",
          dark: "#C0392B",
        },
        info: {
          DEFAULT: "#4A90D9",
          light: "#E8F0FE",
        },
        brand: {
          green: "#3DB87A",
          dark: "#2D6A4F",
        },
        handle: "#D0D5DD",
      },
      fontFamily: {
        sans: ["DMSans_400Regular", "DMSans_500Medium", "DMSans_700Bold"],
        mono: ["DMMono_400Regular", "DMMono_500Medium"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0, 0, 0, 0.05)",
        sm: "0 2px 8px rgba(0, 0, 0, 0.06)",
        md: "0 4px 20px rgba(0, 0, 0, 0.09)",
        lg: "0 12px 40px rgba(0, 0, 0, 0.14)",
        green: "0 4px 20px rgba(61, 184, 122, 0.3)",
      },
    },
  },
  plugins: [],
};
