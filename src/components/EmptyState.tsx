import React from "react";
import { View, Text } from "react-native";
import { ShoppingBasket } from "lucide-react-native";

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
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View className="mb-6 h-24 w-24 items-center justify-center rounded-[32px] bg-primary-50">
        <ShoppingBasket stroke="#3DB87A" size={40} strokeWidth={1.5} />
      </View>
      <Text className="mb-3 text-center text-[22px] font-bold text-text-primary tracking-tight">
        {title}
      </Text>
      <Text className="text-center text-[15px] leading-6 text-text-muted px-4">
        {description}
      </Text>
    </View>
  );
};

export default EmptyState;
