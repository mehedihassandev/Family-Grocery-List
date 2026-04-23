import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Users } from "lucide-react-native";
import { SubHeader } from "../components/ui";

const JoinFamilyScreen = () => {
  const navigation = useNavigation<any>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    // To be implemented...
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 1000);
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <SubHeader title="Join Family" />

      <View className="p-6">
        <View className="items-center mb-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 mb-4">
            <Users stroke="#59AC77" size={32} />
          </View>
          <Text className="text-[24px] font-black text-text-primary mb-2 text-center">
            Got an Invite Code?
          </Text>
          <Text className="text-[15px] text-text-secondary text-center px-4">
            Paste the invite code shared by your family member below to join their existing list.
          </Text>
        </View>

        <Text className="text-[13px] font-semibold text-text-secondary mb-2 ml-1">INVITE CODE</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="e.g. ABC123XYZ"
          placeholderTextColor="#95a39a"
          autoCapitalize="characters"
          className="border border-border-muted bg-surface rounded-2xl p-4 text-[18px] font-bold text-text-primary mb-6"
        />

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!code || loading}
          onPress={handleJoin}
          className={`py-4 rounded-2xl items-center ${
            !code || loading ? "bg-primary-300" : "bg-primary-600"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-[16px] font-bold text-white tracking-wide">Join Family</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default JoinFamilyScreen;
