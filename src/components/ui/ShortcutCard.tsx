import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface IShortcutCardProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  iconBgColor?: string;
  iconColor?: string;
}

/**
 * Modern shortcut button with icon and label
 * Why: To provide quick navigation to main features in a visually premium, rounded-square format.
 * @param props - Component props including icon, label, and press handler
 */
const ShortcutCard = ({
  icon: Icon,
  label,
  onPress,
  iconBgColor = "bg-surface-alt",
  iconColor = "#3DB87A",
}: IShortcutCardProps) => {
  return (
    <View className="items-center">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className={`mb-3 h-[68px] w-[68px] items-center justify-center rounded-[24px] border border-border/50 shadow-sm ${iconBgColor}`}
      >
        <Icon stroke={iconColor} size={26} strokeWidth={2.2} />
      </TouchableOpacity>
      <Text className="text-[13px] font-bold text-text-secondary text-center">
        {label}
      </Text>
    </View>
  );
};

export default ShortcutCard;
