import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { LucideIcon } from "lucide-react-native";

type ShortcutCardProps = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  iconBgColor?: string;
  iconColor?: string;
};

/**
 * Circle shortcut button with icon and label
 * Why: To provide quick navigation to main features in a visually clean way.
 */
const ShortcutCard = ({
  icon: Icon,
  label,
  onPress,
  iconBgColor = "bg-surface-alt",
  iconColor = "#3DB87A",
}: ShortcutCardProps) => {
  return (
    <View className="items-center">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className={`mb-2 h-[56px] w-[56px] items-center justify-center rounded-full border border-border ${iconBgColor}`}
      >
        <Icon stroke={iconColor} size={24} strokeWidth={2.2} />
      </TouchableOpacity>
      <Text className="text-[13px] font-semibold text-text-secondary text-center">
        {label}
      </Text>
    </View>
  );
};

export default ShortcutCard;
