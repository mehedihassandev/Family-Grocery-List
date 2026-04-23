import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { SubHeader, Card } from "../components/ui";

const HelpSupportScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <SubHeader title="Help & Support" />

      <View className="p-6">
        <Card className="items-center justify-center py-12 px-6">
          <Text className="text-[16px] font-medium text-text-secondary text-center">
            FAQs, Support contact, and App Info coming soon...
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;
