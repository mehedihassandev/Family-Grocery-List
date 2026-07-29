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
  iconBgColor = "bg-slate-50",
  iconColor = "#10B981",
}: IShortcutCardProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-1 items-center justify-center py-1"
    >
      <View
        className={`mb-1.5 h-11 w-11 items-center justify-center rounded-full ${iconBgColor}`}
      >
        <Icon stroke={iconColor} size={20} strokeWidth={2} />
      </View>
      <Text
        className="text-[11px] font-semibold text-slate-600 text-center tracking-tight"
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default ShortcutCard;
