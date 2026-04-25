import React, { useState } from "react";
import { View, Text, Alert, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Lock, Camera, Check } from "lucide-react-native";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { SubHeader, Card, PrimaryButton, RhfTextfield } from "../components/ui";
import { useAuthStore } from "../store/useAuthStore";
import { updateUserAccountProfile } from "../services/auth";

const schema = yup.object().shape({
  displayName: yup.string().required("Name is required").min(2, "Name is too short"),
});

/**
 * EditProfileScreen allows users to update their display name and view account info.
 * It resolves the "coming soon" dead-end by providing actual functionality.
 */
const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      displayName: user?.displayName || "",
    },
  });

  const onSubmit = async (data: { displayName: string }) => {
    if (!user) return;

    setLoading(true);
    try {
      await updateUserAccountProfile(user.uid, {
        displayName: data.displayName,
      });
      Alert.alert("Success", "Profile updated successfully");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <SubHeader title="Edit Profile" />

      <View className="flex-1 p-6">
        <View className="items-center mb-8">
          <TouchableOpacity
            activeOpacity={0.8}
            className="h-24 w-24 rounded-full bg-surface border-2 border-primary-500 items-center justify-center overflow-hidden"
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <View className="h-full w-full bg-primary-100 items-center justify-center">
                <Text className="text-primary-600 text-3xl font-bold">
                  {user?.displayName?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary-500 items-center justify-center border-2 border-surface">
              <Camera size={14} stroke="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text className="mt-4 text-text-primary font-bold text-lg">{user?.displayName}</Text>
          <Text className="text-text-muted text-xs uppercase tracking-widest mt-1">
            Tap to change photo
          </Text>
        </View>

        <Card className="p-5 mb-6">
          <Text className="text-text-muted text-[11px] font-bold uppercase tracking-widest mb-4">
            Personal Information
          </Text>

          <RhfTextfield
            control={control}
            name="displayName"
            label="Full Name"
            placeholder="Enter your name"
          />

          <View className="mt-4 opacity-60">
            <Text className="text-text-secondary text-[13px] font-bold mb-2">Email Address</Text>
            <View className="flex-row items-center bg-surface-muted rounded-xl px-4 py-3 border border-border">
              <Text className="flex-1 text-text-muted text-[15px]">{user?.email}</Text>
              <Lock size={16} stroke="#9AA3AF" />
            </View>
            <Text className="text-text-muted text-[11px] mt-2">
              Email cannot be changed for security reasons.
            </Text>
          </View>
        </Card>

        <View className="mt-auto">
          <PrimaryButton
            title={loading ? "Saving..." : "Save Changes"}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            icon={loading ? <ActivityIndicator color="#FFF" size="small" /> : <Check size={20} stroke="#FFF" />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
