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
  iconBgColor = "bg-primary-50 dark:bg-primary-900/20",
  iconColor = "#59AC77",
}: ShortcutCardProps) => {
  return (
    <View className="items-center">
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        className={`mb-1.5 h-[56px] w-[56px] items-center justify-center rounded-full ${iconBgColor}`}
      >
        <Icon stroke={iconColor} size={22} strokeWidth={2.4} />
      </TouchableOpacity>
      <Text className="text-[13px] font-medium tracking-tight text-text-secondary dark:text-text-dark-secondary text-center">
        {label}
      </Text>
    </View>
  );
};

export default ShortcutCard;
