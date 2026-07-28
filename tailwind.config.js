/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        secondary: {
          50: "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
        },
        text: {
          900: "#0F172A",
          500: "#475569",
          300: "#94A3B8",
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
          subtle: "#CBD5E1",
          inverse: "#FFFFFF",
        },
        background: {
          DEFAULT: "#F8FAFC",
          alt: "#F1F5F9",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8FAFC",
          alt: "#F1F5F9",
          subtle: "#E2E8F0",
        },
        border: {
          DEFAULT: "#E2E8F0",
          muted: "#F1F5F9",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          dark: "#D97706",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
          dark: "#DC2626",
        },
        urgent: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
          dark: "#DC2626",
        },
        medium: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          dark: "#D97706",
        },
        info: {
          DEFAULT: "#3B82F6",
          light: "#EFF6FF",
        },
        brand: {
          green: "#10B981",
          dark: "#059669",
        },
        handle: "#CBD5E1",
      },
      fontFamily: {
        sans: ["DMSans_400Regular", "DMSans_500Medium", "DMSans_700Bold"],
        mono: ["DMMono_400Regular", "DMMono_500Medium"],
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(15, 23, 42, 0.04)",
        sm: "0 2px 8px rgba(15, 23, 42, 0.04)",
        md: "0 4px 20px rgba(15, 23, 42, 0.08)",
        lg: "0 12px 40px rgba(15, 23, 42, 0.12)",
        green: "0 4px 20px rgba(16, 185, 129, 0.25)",
      },
    },
  },
  plugins: [],
};

