import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { LucideIcon } from "lucide-react-native";
import { useAppTheme } from "../../hooks";

interface IShortcutCardProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  iconBgColor?: string;
  bgColor?: string;
  iconColor?: string;
  isCircular?: boolean;
}

/**
 * Modern shortcut button with icon and label
 * Why: To provide quick navigation to main features in a visually premium format.
 * @param props - Component props including icon, label, and press handler
 */
const ShortcutCard = ({
  icon: Icon,
  label,
  onPress,
  iconBgColor,
  bgColor,
  iconColor,
  isCircular = false,
}: IShortcutCardProps) => {
  const { colors } = useAppTheme();
  const resolvedIconColor = iconColor || colors.accent;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-1 items-center justify-center py-1.5"
    >
      <View
        className={`mb-2 h-14 w-14 items-center justify-center border ${
          isCircular ? "rounded-full" : "rounded-xl"
        } ${iconBgColor ?? ""}`}
        style={{
          backgroundColor: bgColor ?? (!iconBgColor ? colors.bgInput : undefined),
          borderColor: colors.borderSubtle,
        }}
      >
        <Icon stroke={resolvedIconColor} size={22} strokeWidth={2} />
      </View>
      <Text
        className="text-[12px] font-bold text-center tracking-tight"
        numberOfLines={1}
        style={{ color: colors.textPrimary }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default ShortcutCard;
