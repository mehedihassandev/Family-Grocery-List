import React from "react";
import { View, Text } from "react-native";
import { ShoppingBasket } from "lucide-react-native";

interface EmptyStateProps {
  title: string;
  description: string;
}

const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-primary-50">
        <ShoppingBasket stroke="#3DB87A" size={34} strokeWidth={2.2} />
      </View>
      <Text className="mb-2 text-center text-xl font-bold text-text-primary">{title}</Text>
      <Text className="text-center text-[15px] leading-6 text-text-muted">{description}</Text>
    </View>
  );
};

export default EmptyState;
