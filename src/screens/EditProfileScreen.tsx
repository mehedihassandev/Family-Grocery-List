import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { SubHeader, Card } from "../components/ui";

const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <SubHeader title="Edit Profile" />

      <View className="p-6">
        <Card className="items-center justify-center py-12 px-6">
          <Text className="text-[16px] font-medium text-text-secondary text-center">
            Profile editing functionality coming soon...
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
