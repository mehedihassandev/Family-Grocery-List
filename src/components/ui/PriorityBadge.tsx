import React from "react";
import { Text, View } from "react-native";
import { GroceryPriority } from "../../features/grocery";

type PriorityBadgeProps = {
  priority: GroceryPriority;
};

const labelMap: Record<GroceryPriority, string> = {
  urgent: "Urgent",
  medium: "Medium",
  low: "Low",
};

const styleMap: Record<GroceryPriority, string> = {
  urgent: "bg-danger-light text-danger-dark border-danger/20",
  medium: "bg-warning-light text-warning-dark border-warning/20",
  low: "bg-primary-100 text-primary-600 border-primary-200",
};

/**
 * PriorityBadge displays a color-coded label for item priority.
 * Why: To provide immediate visual context of an item's urgency.
 */
const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  return (
    <View className={`rounded-md border px-2 py-0.5 ${styleMap[priority]}`}>
      <Text className="text-[10px] font-bold uppercase tracking-widest">{labelMap[priority]}</Text>
    </View>
  );
};

export default PriorityBadge;
