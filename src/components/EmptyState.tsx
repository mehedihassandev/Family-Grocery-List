import React from "react";
import { View, Text, Image } from "react-native";
import { ShoppingBasket } from "lucide-react-native";

interface EmptyStateProps {
  title: string;
  description: string;
}

const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <View className="flex-1 justify-center items-center px-8">
      <View className="w-32 h-32 bg-primary-50 rounded-full items-center justify-center mb-6">
        <ShoppingBasket stroke="#59AC77" size={60} />
      </View>
      <Text className="text-2xl font-bold text-text-primary mb-2 text-center">
        {title}
      </Text>
      <Text className="text-text-muted text-center text-lg">{description}</Text>
    </View>
  );
};

export default EmptyState;
