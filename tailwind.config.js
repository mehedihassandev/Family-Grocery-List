/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: require("./src/theme/colors.json"),
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

