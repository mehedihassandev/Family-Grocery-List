import React from "react";
import { View, Text } from "react-native";
import { useAppTheme } from "../hooks";
import { appThemeColors } from "../theme";

type ColorKey = keyof typeof appThemeColors.light;

const categoryColors: Record<string, { badge: ColorKey; text: ColorKey; border: ColorKey }> = {
  Beauty: {
    badge: "infoLight",
    text: "info",
    border: "infoLight",
  },
  Meat: {
    badge: "dangerLight",
    text: "danger",
    border: "dangerLight",
  },
  Fish: {
    badge: "infoLight",
    text: "info",
    border: "infoLight",
  },
  Vegetables: {
    badge: "accentLightSubtle",
    text: "accentDark",
    border: "accentLight",
  },
  Fruits: {
    badge: "accentLightSubtle",
    text: "accent",
    border: "accentLight",
  },
  Dairy: {
    badge: "warningLight",
    text: "warning",
    border: "warningLight",
  },
  Snacks: {
    badge: "warningLight",
    text: "warning",
    border: "warningLight",
  },
  Drinks: {
    badge: "infoLight",
    text: "info",
    border: "infoLight",
  },
  Household: {
    badge: "bgSurfaceMuted",
    text: "textSecondary",
    border: "border",
  },
  Medicine: {
    badge: "infoLight",
    text: "info",
    border: "infoLight",
  },
  Other: {
    badge: "bgSurfaceMuted",
    text: "textMuted",
    border: "border",
  },
};

const CategoryBadge = ({ category }: { category: string }) => {
  const { colors } = useAppTheme();
  const colorMapping = categoryColors[category] || categoryColors["Other"];

  return (
    <View
      className="px-2.5 py-1 rounded-xl border"
      style={{
        backgroundColor: colors[colorMapping.badge] as string,
        borderColor: colors[colorMapping.border] as string,
      }}
    >
      <Text
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{
          color: colors[colorMapping.text] as string,
        }}
      >
        {category}
      </Text>
    </View>
  );
};

export default CategoryBadge;
