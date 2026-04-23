import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { PlusCircle } from "lucide-react-native";
import { SubHeader } from "../components/ui";

const CreateFamilyScreen = () => {
  const navigation = useNavigation<any>();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    // To be implemented...
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 1000);
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <SubHeader title="Create Family" />

      <View className="p-6">
        <View className="items-center mb-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 mb-4">
            <PlusCircle stroke="#59AC77" size={32} />
          </View>
          <Text className="text-[24px] font-black text-text-primary mb-2 text-center">
            Start a New Grocery List
          </Text>
          <Text className="text-[15px] text-text-secondary text-center px-4">
            Create a family and invite members to start collaborating on groceries.
          </Text>
        </View>

        <Text className="text-[13px] font-semibold text-text-secondary mb-2 ml-1">FAMILY NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. The Smiths, Our Home"
          placeholderTextColor="#95a39a"
          className="border border-border-muted bg-surface rounded-2xl p-4 text-[18px] font-bold text-text-primary mb-6"
        />

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!name || loading}
          onPress={handleCreate}
          className={`py-4 rounded-2xl items-center ${
            !name || loading ? "bg-primary-300" : "bg-primary-600"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-[16px] font-bold text-white tracking-wide">Create Family</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreateFamilyScreen;
