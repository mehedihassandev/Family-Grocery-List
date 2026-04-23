import React from "react";
import { View, Text, SafeAreaView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SubHeader } from "../components/ui";

const PrivacySecurityScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <SubHeader title="Privacy & Security" />

      <View className="p-6">
        <Text className="text-[16px] text-text-secondary text-center mt-10">
          Privacy settings and security options coming soon...
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default PrivacySecurityScreen;
