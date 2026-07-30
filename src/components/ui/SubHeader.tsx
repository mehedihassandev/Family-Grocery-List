import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useAppTheme } from "../../hooks";

interface ISubHeaderProps {
  title: string;
  onBackPress?: () => void;
}

/**
 * Secondary header for internal screens
 * Why: To provide a consistent back navigation and screen title for secondary application surfaces with dark mode.
 * @param props - Component props including screen title and optional back handler override
 */
export const SubHeader = ({ title, onBackPress }: ISubHeaderProps) => {
  const { colors } = useAppTheme();

  /**
   * Handles the back navigation action
   */
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    }
  };

  return (
    <View
      className="px-6 py-4 flex-row items-center border-b"
      style={{ backgroundColor: colors.bgCanvas, borderBottomColor: colors.borderSubtle }}
    >
      <TouchableOpacity
        onPress={handleBack}
        className="mr-4 h-10 w-10 items-center justify-center rounded-full border"
        style={{ backgroundColor: colors.bgSurface, borderColor: colors.border }}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <ArrowLeft stroke={colors.icon} size={20} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text
        className="text-[18px] font-bold"
        numberOfLines={1}
        style={{ color: colors.textPrimary }}
      >
        {title}
      </Text>
    </View>
  );
};
