import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

interface ISubHeaderProps {
  title: string;
  onBackPress?: () => void;
}

/**
 * Secondary header for internal screens
 * Why: To provide a consistent back navigation and screen title for secondary application surfaces.
 * @param props - Component props including screen title and optional back handler override
 */
export const SubHeader = ({ title, onBackPress }: ISubHeaderProps) => {
  const navigation = useNavigation();

  /**
   * Handles the back navigation action
   */
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
    <View className="px-6 py-4 flex-row items-center border-b border-border bg-background">
      <TouchableOpacity 
        onPress={handleBack} 
        className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-surface-alt border border-border"
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <ArrowLeft stroke="#4A5568" size={20} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text className="text-[18px] font-bold text-text-900" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
};
