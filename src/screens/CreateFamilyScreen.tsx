import React, { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { PlusCircle, Check } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FirebaseError } from "firebase/app";
import {
  SubHeader,
  RhfTextfield,
  LoadingOverlay,
  StatusModal,
  PrimaryButton,
} from "../components/ui";
import type { RootStackNavigationProp } from "../types";
import { createFamily } from "../services/family";
import { useAuthStore } from "../store/useAuthStore";
import { createFamilySchema, type CreateFamilyFormValues } from "../utils/validationSchemas";

const FAMILY_ACTION_TIMEOUT_MS = 15000;

/**
 * Maps family operation errors to user-friendly messages
 * @param error - The error object
 */
const getFamilyErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "permission-denied":
        return "Permission denied. Check Firestore rules.";
      case "unavailable":
        return "Network unavailable. Try again.";
      default:
        return error.message || "Unexpected error.";
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  return "Unexpected error. Try again.";
};

/**
 * Wraps a family action promise with a timeout
 * @param operation - The promise to wrap
 * @param timeoutMessage - Message to display on timeout
 */
async function withFamilyActionTimeout<T>(
  operation: Promise<T>,
  timeoutMessage: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, FAMILY_ACTION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Premium Create Family Screen
 * Why: To provide a high-fidelity experience for starting new family groups with elegant feedback.
 */
const CreateFamilyScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuthStore();
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

  const { control, handleSubmit } = useForm<CreateFamilyFormValues>({
    resolver: yupResolver(createFamilySchema),
    mode: "onTouched",
    defaultValues: { name: "" },
  });

  /**
   * Handles the creation of a new family
   * @param values - Validated form values containing the family name
   */
  const handleCreate = async (values: CreateFamilyFormValues) => {
    setLoading(true);
    try {
      if (!user?.uid) throw new Error("Please sign in to create a family.");

      const family = await withFamilyActionTimeout(
        createFamily(user.uid, values.name),
        "Create family timed out. Check network.",
      );

      setUser({ ...user, familyId: family.id, role: "owner" });
      setStatusModal({
        visible: true,
        title: "Family Created!",
        message: `${family.name} is ready. Share your invite code to start collaborating.`,
        type: "success",
      });
    } catch (error) {
      setStatusModal({
        visible: true,
        title: "Create Failed",
        message: getFamilyErrorMessage(error),
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

      <SubHeader title="Create Family" />

      <View className="flex-1 p-6">
        <View className="items-center mb-10">
          <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-primary-50 mb-6">
            <PlusCircle stroke="#3DB87A" size={40} strokeWidth={1.5} />
          </View>
          <Text className="text-[26px] font-bold text-text-primary mb-3 text-center tracking-tight">
            Start Your Group
          </Text>
          <Text className="text-[15px] leading-6 text-text-secondary text-center px-6">
            Create a family and invite members to start collaborating on your grocery list in
            real-time.
          </Text>
        </View>

        <View className="bg-white rounded-[32px] p-8 border border-border/50 shadow-sm">
          <RhfTextfield
            control={control}
            name="name"
            label="FAMILY NAME"
            placeholder="e.g. The Smiths, Our Home"
            inputClassName="text-[18px] font-bold h-14"
          />

          <View className="mt-8">
            <PrimaryButton
              title="Create Family"
              onPress={handleSubmit(handleCreate)}
              icon={<Check size={20} stroke="#FFF" strokeWidth={2.5} />}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CreateFamilyScreen;
