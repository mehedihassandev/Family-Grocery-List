import React from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "../../hooks";

interface IPriorityBadgeProps {
  priority: string;
}

/**
 * Premium Theme-Aware Priority Badge Component matching design mockups
 */
export const PriorityBadge = ({ priority }: IPriorityBadgeProps) => {
  const { isDark, colors } = useAppTheme();

  let bg = colors.bgInput;
  let text = colors.textSecondary;
  let border = "transparent";

  const pLower = (priority || "").toLowerCase();

  if (pLower === "urgent" || pLower === "high") {
    bg = isDark ? "#3B1219" : "#FEE2E2";
    text = isDark ? "#EF4444" : "#DC2626";
    border = isDark ? "#7F1D1D" : "#FCA5A5";
  } else if (pLower === "medium") {
    bg = isDark ? "#064E3B" : "#D1FAE5";
    text = isDark ? "#34D399" : "#059669";
    border = isDark ? "#047857" : "#6EE7B7";
  } else if (pLower === "low") {
    bg = isDark ? "#1E293B" : "#E0E7FF";
    text = isDark ? "#94A3B8" : "#4338CA";
    border = isDark ? "#334155" : "#C7D2FE";
  }

  return (
    <View
      className="px-2.5 py-0.5 rounded-full border items-center justify-center"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <Text className="text-[10px] font-bold capitalize tracking-tight" style={{ color: text }}>
        {priority}
      </Text>
    </View>
  );
};

export default PriorityBadge;
