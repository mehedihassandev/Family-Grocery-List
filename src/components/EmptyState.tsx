import React from "react";
import { View, Text } from "react-native";
import { ShoppingBasket } from "lucide-react-native";
import { useAppTheme } from "../hooks";

interface IEmptyStateProps {
  title: string;
  description: string;
}

/**
 * Premium EmptyState
 * Why: To provide a visually pleasing placeholder when no content is available.
 * @param props - Component props including title and description text
 */
const EmptyState = ({ title, description }: IEmptyStateProps) => {
  const { colors } = useAppTheme();

  return (
    <View className="flex-1 items-center justify-center px-10">
      <View
        className="mb-6 h-24 w-24 items-center justify-center rounded-[32px]"
        style={{ backgroundColor: colors.accentLightSubtle }}
      >
        <ShoppingBasket stroke={colors.accent} size={40} strokeWidth={1.5} />
      </View>
      <Text
        className="mb-3 text-center text-[22px] font-bold tracking-tight"
        style={{ color: colors.textPrimary }}
      >
        {title}
      </Text>
      <Text className="text-center text-[15px] leading-6 px-4" style={{ color: colors.textMuted }}>
        {description}
      </Text>
    </View>
  );
};

export default EmptyState;
