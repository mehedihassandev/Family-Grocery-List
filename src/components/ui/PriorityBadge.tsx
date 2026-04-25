import React from "react";
import { Text, View } from "react-native";

type PriorityBadgeProps = {
  priority: string;
};

const styleMap: Record<string, { bg: string; text: string; border: string }> = {
  Urgent: { bg: "bg-danger-light", text: "text-danger-dark", border: "border-danger-light" },
  Medium: { bg: "bg-warning-light", text: "text-warning-dark", border: "border-warning-light" },
  Low: { bg: "bg-primary-100", text: "text-primary-600", border: "border-primary-100" },
};

/**
 * Premium PriorityBadge
 * Why: To display item priority in a visually clean and consistent way across the app.
 */
const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const styles = styleMap[priority] || styleMap.Low;
  
  return (
    <View className={`px-2.5 py-1 rounded-lg border ${styles.bg} ${styles.border}`}>
      <Text className={`${styles.text} text-[10px] font-black uppercase tracking-widest`}>
        {priority}
      </Text>
    </View>
  );
};

export default PriorityBadge;
