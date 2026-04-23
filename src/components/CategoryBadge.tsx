import React from "react";
import { View, Text } from "react-native";

const categoryColors: Record<string, { badge: string; text: string; border: string }> = {
  Beauty: {
    badge: "bg-secondary-50",
    text: "text-secondary-600",
    border: "border-secondary-100",
  },
  Meat: {
    badge: "bg-urgent/10",
    text: "text-urgent",
    border: "border-urgent/20",
  },
  Fish: {
    badge: "bg-secondary-50",
    text: "text-secondary-700",
    border: "border-secondary-100",
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
    badge: "bg-medium/15",
    text: "text-medium",
    border: "border-medium/30",
  },
  Snacks: {
    badge: "bg-secondary-50",
    text: "text-secondary-600",
    border: "border-secondary-100",
  },
  Drinks: {
    badge: "bg-secondary-50",
    text: "text-secondary-700",
    border: "border-secondary-100",
  },
  Household: {
    badge: "bg-surface-subtle",
    text: "text-text-secondary",
    border: "border-border-muted",
  },
  Medicine: {
    badge: "bg-secondary-50",
    text: "text-secondary-700",
    border: "border-secondary-100",
  },
  Other: {
    badge: "bg-surface-subtle",
    text: "text-text-muted",
    border: "border-border-muted",
  },
};

const CategoryBadge = ({ category }: { category: string }) => {
  const colorClass = categoryColors[category] || categoryColors["Other"];

  return (
    <View className={`px-2.5 py-0.5 rounded-full border ${colorClass.badge} ${colorClass.border}`}>
      <Text className={`text-[9px] font-black uppercase tracking-wider ${colorClass.text}`}>
        {category}
      </Text>
    </View>
  );
};

export default CategoryBadge;
