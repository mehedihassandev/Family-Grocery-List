import React from "react";
import { View, Text } from "react-native";

const categoryColors: Record<string, { badge: string; text: string; border: string }> = {
  Beauty: {
    badge: "bg-secondary-50",
    text: "text-secondary-700",
    border: "border-secondary-200",
  },
  Meat: {
    badge: "bg-danger-light",
    text: "text-danger-dark",
    border: "border-danger-light",
  },
  Fish: {
    badge: "bg-secondary-50",
    text: "text-secondary-700",
    border: "border-secondary-200",
  },
  Vegetables: {
    badge: "bg-primary-50",
    text: "text-primary-700",
    border: "border-primary-100",
  },
  Fruits: {
    badge: "bg-primary-50",
    text: "text-primary-600",
    border: "border-primary-100",
  },
  Dairy: {
    badge: "bg-warning-light",
    text: "text-warning-dark",
    border: "border-warning-light",
  },
  Snacks: {
    badge: "bg-warning-light",
    text: "text-warning-dark",
    border: "border-warning-light",
  },
  Drinks: {
    badge: "bg-secondary-50",
    text: "text-secondary-700",
    border: "border-secondary-200",
  },
  Household: {
    badge: "bg-surface-alt",
    text: "text-text-secondary",
    border: "border-border",
  },
  Medicine: {
    badge: "bg-secondary-50",
    text: "text-secondary-700",
    border: "border-secondary-200",
  },
  Other: {
    badge: "bg-surface-alt",
    text: "text-text-muted",
    border: "border-border",
  },
};

const CategoryBadge = ({ category }: { category: string }) => {
  const colorClass = categoryColors[category] || categoryColors["Other"];

  return (
    <View className={`px-2.5 py-1 rounded-xl border ${colorClass.badge} ${colorClass.border}`}>
      <Text className={`text-[10px] font-bold uppercase tracking-wider ${colorClass.text}`}>
        {category}
      </Text>
    </View>
  );
};

export default CategoryBadge;
