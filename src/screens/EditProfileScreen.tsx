import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Lock, Camera, Check } from "lucide-react-native";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  SubHeader,
  Card,
  PrimaryButton,
  RhfTextfield,
  LoadingOverlay,
  StatusModal,
} from "../components/ui";
import { AuthenticatedStackNavigatorScreenProps, ERootRoutes } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { updateUserAccountProfile } from "../services/auth";
import { useTextFormatter } from "../hooks";

const schema = yup.object().shape({
  displayName: yup.string().required("Name is required").min(2, "Name is too short"),
});

/**
 * Premium Edit Profile Screen
 * Why: To provide a high-fidelity experience for updating personal information with elegant feedback.
 */
const EditProfileScreen = ({
  navigation,
}: AuthenticatedStackNavigatorScreenProps<ERootRoutes.EDIT_PROFILE>) => {
  const { user } = useAuthStore();
  const { toInitial } = useTextFormatter();
  const [loading, setLoading] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      displayName: user?.displayName || "",
    },
  });

  /**
   * Handles the submission of profile updates
   * @param data - The form data containing the new display name
   */
  const onSubmit = async (data: { displayName: string }) => {
    if (!user) return;

    setLoading(true);
    try {
      await updateUserAccountProfile(user.uid, {
        displayName: data.displayName,
      });
      setStatusModal({
        visible: true,
        title: "Success",
        message: "Your profile has been updated successfully.",
        type: "success",
      });
    } catch (error) {
      setStatusModal({
        visible: true,
        title: "Update Failed",
        message: error instanceof Error ? error.message : "Failed to update profile",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles closing the status modal and navigating back on success
   */
  const handleModalClose = () => {
    const isSuccess = statusModal.type === "success";
    setStatusModal((prev) => ({ ...prev, visible: false }));
    if (isSuccess) {
      navigation.goBack();
    }
  };

  /**
   * Handles avatar tap until upload flow is implemented
   */
  const handleAvatarPress = () => {
    Alert.alert("Coming soon", "Photo upload will be added in a future update.");
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <LoadingOverlay visible={loading} />
      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={handleModalClose}
      />

      <SubHeader title="Edit Profile" onBackPress={() => navigation.goBack()} />

      <View className="flex-1 p-6">
        <View className="items-center mb-8">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAvatarPress}
            className="h-24 w-24 rounded-[32px] bg-white shadow-md border-2 border-primary-500 items-center justify-center overflow-hidden"
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <View className="h-full w-full bg-primary-50 items-center justify-center">
                <Text className="text-primary-600 text-3xl font-bold">
                  {toInitial(user?.displayName)}
                </Text>
              </View>
            )}
            <View className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary-500 items-center justify-center border-2 border-white">
              <Camera size={14} stroke="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text className="mt-4 text-text-primary font-bold text-lg">{user?.displayName}</Text>
          <Text className="text-text-muted text-xs uppercase tracking-widest mt-1 font-bold">
            Tap for photo update status
          </Text>
        </View>

        <Card className="p-6 mb-6">
          <Text className="text-text-muted text-[11px] font-bold uppercase tracking-[1.5px] mb-5">
            Personal Information
          </Text>

          <RhfTextfield
            control={control}
            name="displayName"
            label="Full Name"
            placeholder="Enter your name"
          />

          <View className="mt-6 opacity-60">
            <Text className="text-text-secondary text-[13px] font-bold mb-2">Email Address</Text>
            <View className="flex-row items-center bg-surface-muted rounded-2xl px-4 py-4 border border-border">
              <Text className="flex-1 text-text-muted text-[15px] font-medium">{user?.email}</Text>
              <Lock size={16} stroke="#9AA3AF" />
            </View>
            <Text className="text-text-muted text-[11px] mt-2 font-medium">
              Email cannot be changed for security reasons.
            </Text>
          </View>
        </Card>

        <View className="mt-auto">
          <PrimaryButton
            title="Save Changes"
            onPress={handleSubmit(onSubmit)}
            icon={<Check size={20} stroke="#FFF" strokeWidth={2.5} />}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
