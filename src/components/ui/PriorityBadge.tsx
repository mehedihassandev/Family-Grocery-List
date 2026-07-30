import React from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "../../hooks";

interface IPriorityBadgeProps {
  priority: string;
}

/**
 * Premium Theme-Aware Priority Badge Component
 * Features clean rounded pills with theme-aware tints for Urgent, Medium, and Low.
 */
export const PriorityBadge = ({ priority }: IPriorityBadgeProps) => {
  const { colors } = useAppTheme();

  let bg = colors.bgInput;
  let text = colors.textSecondary;
  let border = colors.border;

  if (priority === "Urgent" || priority === "high") {
    bg = colors.dangerLight;
    text = colors.danger;
    border = colors.danger;
  } else if (priority === "Medium" || priority === "medium") {
    bg = colors.warningLight;
    text = colors.warning;
    border = colors.warning;
  } else if (priority === "Low" || priority === "low") {
    bg = colors.accentLightSubtle;
    text = colors.accent;
    border = colors.accent;
  }

  return (
    <View
      className="px-2.5 py-0.5 rounded-full border items-center justify-center"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <Text className="text-[9px] font-black uppercase tracking-wider" style={{ color: text }}>
        {priority}
      </Text>
    </View>
  );
};

export default PriorityBadge;
