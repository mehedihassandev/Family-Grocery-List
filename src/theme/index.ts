import lightColors from "./colors.json";

/**
 * Modern Design System Tokens
 * Designed with Facebook & Modern iOS 18 Design Language:
 * - Canvas: Soft slate wash (#F8FAFC Light / #0B0F17 Ultra-deep Midnight Charcoal Dark)
 * - Card/Surface: Crisp Elevated White (#FFFFFF Light) / Elevated Dark Slate (#161F2E Dark)
 * - Inputs & Pills: Level 2 Elevation (#F1F5F9 Light / #212D40 Dark)
 * - Modals & Sheets: High Elevation Level 3 (#FFFFFF Light / #2A384E Dark)
 */

export const darkColors = {
  ...lightColors,
  background: {
    DEFAULT: "#0B0F17",
    alt: "#161F2E",
  },
  surface: {
    DEFAULT: "#161F2E",
    muted: "#212D40",
    alt: "#161F2E",
    subtle: "#212D40",
    elevated: "#2A384E",
  },
  card: {
    DEFAULT: "#161F2E",
    alt: "#212D40",
  },
  text: {
    primary: "#F8FAFC",
    secondary: "#94A3B8",
    muted: "#64748B",
    subtle: "#64748B",
    inverse: "#0F172A",
    "900": "#F8FAFC",
    "500": "#94A3B8",
    "300": "#64748B",
  },
  border: {
    DEFAULT: "#253347",
    muted: "#1B2637",
    focus: "#34D399",
  },
};

export const appThemeColors = {
  light: {
    // Canvas & Elevation (Modern Slate Wash)
    bgCanvas: "#F8FAFC",
    bgSurface: "#FFFFFF",
    bgCard: "#FFFFFF",
    bgInput: "#F1F5F9",
    bgElevated: "#FFFFFF",
    bgHover: "#F1F5F9",
    bgPressed: "#E2E8F0",
    overlayBg: "rgba(15, 23, 42, 0.4)",

    // Borders & Dividers
    border: "#E2E8F0",
    borderSubtle: "#F1F5F9",
    borderFocus: "#059669",

    // Typography
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    textInverse: "#FFFFFF",

    // Icons
    icon: "#475569",
    iconMuted: "#94A3B8",

    // Brand Accents
    accent: "#059669",
    accentLight: "#10B981",
    accentDark: "#047857",
    accentMuted: "#D1FAE5",
    accentGlow: "rgba(5, 150, 105, 0.12)",

    // Status Colors
    danger: "#EF4444",
    dangerLight: "#FEE2E2",
    warning: "#D97706",
    warningLight: "#FEF3C7",
    info: "#0284C7",
    infoLight: "#EFF6FF",
    success: "#10B981",
    successLight: "#D1FAE5",

    // Navigation & Components
    tabBarBg: "#FFFFFF",
    tabBarBorder: "#E2E8F0",
    headerBg: "#FFFFFF",
    headerBgTranslucent: "rgba(255, 255, 255, 0.85)",
    white: "#FFFFFF",
    black: "#0F172A",
    bgCartActive: "#FEF3C7",
    accentLightSubtle: "#ECFDF5",
    bgSurfaceMuted: "#F8FAFC",

    // Badge & Accent Soft Variants
    badgePurpleBg: "#F3E8FF",
    badgePurpleBorder: "#E9D5FF",
    badgePurpleText: "#7E22CE",
    badgeRoseBg: "#FFE4E6",
    badgeRoseBorder: "#FECDD3",
    badgeRoseText: "#BE123C",
    badgeAmberBg: "#FEF3C7",
    badgeAmberBorder: "#FDE68A",
    badgeAmberText: "#B45309",

    // Category Specific Accents
    categoryProduce: "#059669",
    categoryMeat: "#DC2626",
    categoryFish: "#0284C7",
    categoryDairy: "#D97706",
    categorySnacks: "#7C3AED",
    categoryDrinks: "#0891B2",
    categoryHousehold: "#475569",
    categoryOther: "#64748B",
  },
  dark: {
    // Canvas & Elevation (Ultra-Deep Slate Charcoal - Facebook Modern Dark Style)
    bgCanvas: "#0B0F17",
    bgSurface: "#161F2E",
    bgCard: "#161F2E",
    bgInput: "#212D40",
    bgElevated: "#2A384E",
    bgHover: "#2A384E",
    bgPressed: "#354763",
    overlayBg: "rgba(0, 0, 0, 0.75)",

    // Borders & Dividers
    border: "#253347",
    borderSubtle: "#1B2637",
    borderFocus: "#34D399",

    // Typography
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    textInverse: "#0F172A",

    // Icons
    icon: "#94A3B8",
    iconMuted: "#64748B",

    // Brand Accents
    accent: "#34D399",
    accentLight: "#10B981",
    accentDark: "#059669",
    accentMuted: "#064E3B",
    accentGlow: "rgba(52, 211, 153, 0.18)",

    // Status Colors
    danger: "#F87171",
    dangerLight: "#450A0A",
    warning: "#F59E0B",
    warningLight: "#3A2E16",
    info: "#60A5FA",
    infoLight: "#102A45",
    success: "#34D399",
    successLight: "#064E3B",

    // Navigation & Components
    tabBarBg: "#161F2E",
    tabBarBorder: "#253347",
    headerBg: "#161F2E",
    headerBgTranslucent: "rgba(22, 31, 46, 0.85)",
    white: "#FFFFFF",
    black: "#0F172A",
    bgCartActive: "#3A3219",
    accentLightSubtle: "#0B3527",
    bgSurfaceMuted: "#161F2E",

    // Badge & Accent Soft Variants
    badgePurpleBg: "#2E1065",
    badgePurpleBorder: "#581C87",
    badgePurpleText: "#D8B4FE",
    badgeRoseBg: "#4C0519",
    badgeRoseBorder: "#881337",
    badgeRoseText: "#FDA4AF",
    badgeAmberBg: "#451A03",
    badgeAmberBorder: "#78350F",
    badgeAmberText: "#FDE68A",

    // Category Specific Accents
    categoryProduce: "#34D399",
    categoryMeat: "#F87171",
    categoryFish: "#60A5FA",
    categoryDairy: "#FBBF24",
    categorySnacks: "#A78BFA",
    categoryDrinks: "#22D3EE",
    categoryHousehold: "#94A3B8",
    categoryOther: "#A1A1AA",
  },
};

export { lightColors };
