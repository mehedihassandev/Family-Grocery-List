import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

interface SubHeaderProps {
  title: string;
  onBackPress?: () => void;
}

export const SubHeader = ({ title, onBackPress }: SubHeaderProps) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  return (
    <View className="px-6 py-4 flex-row items-center border-b border-border-muted bg-surface">
      <TouchableOpacity 
        onPress={handleBack} 
        className="mr-4 p-1"
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <ArrowLeft stroke="#637889" size={24} />
      </TouchableOpacity>
      <Text className="text-[20px] font-bold text-text-primary" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
};
