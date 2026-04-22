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
  urgent: "bg-urgent/10 text-urgent border-urgent/20",
  medium: "bg-medium/15 text-medium border-medium/30",
  low: "bg-primary-50 text-primary-700 border-primary-100",
};

const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  return (
    <View className={`rounded-full border px-2.5 py-0.5 ${styleMap[priority]}`}>
      <Text className="text-[10px] font-bold uppercase tracking-widest">
        {labelMap[priority]}
      </Text>
    </View>
  );
};

export default PriorityBadge;
