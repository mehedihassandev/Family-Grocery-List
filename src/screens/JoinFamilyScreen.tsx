import React, { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Users, ArrowRight } from "lucide-react-native";
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
import { joinFamily } from "../services/family";
import { useAuthStore } from "../store/useAuthStore";
import { joinFamilySchema, type JoinFamilyFormValues } from "../utils/validationSchemas";

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
 * Premium Join Family Screen
 * Why: To provide a clean, modern experience for entering invite codes with elegant feedback.
 */
const JoinFamilyScreen = () => {
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

  const { control, handleSubmit, setError, clearErrors } = useForm<JoinFamilyFormValues>({
    resolver: yupResolver(joinFamilySchema),
    mode: "onTouched",
    defaultValues: { code: "" },
  });

  /**
   * Handles joining an existing family via invite code
   * @param values - Validated form values containing the invite code
   */
  const handleJoin = async (values: JoinFamilyFormValues) => {
    setLoading(true);
    try {
      clearErrors("code");
      if (!user?.uid) throw new Error("Please sign in to join a family.");

      const family = await withFamilyActionTimeout(
        joinFamily(user.uid, values.code),
        "Join family timed out. Check network.",
      );

      setUser({ ...user, familyId: family.id, role: "member" });
      setStatusModal({
        visible: true,
        title: "Welcome!",
        message: `You've successfully joined ${family.name}.`,
        type: "success",
      });
    } catch (error) {
      const message = getFamilyErrorMessage(error);
      if (message.toLowerCase().includes("invalid invite code")) {
        setError("code", { type: "manual", message });
        return;
      }
      setStatusModal({
        visible: true,
        title: "Join Failed",
        message,
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

      <SubHeader title="Join Family" />

      <View className="flex-1 p-6">
        <View className="items-center mb-10">
          <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-primary-50 mb-6">
            <Users stroke="#3DB87A" size={40} strokeWidth={1.5} />
          </View>
          <Text className="text-[26px] font-bold text-text-primary mb-3 text-center tracking-tight">
            Got an Invite Code?
          </Text>
          <Text className="text-[15px] leading-6 text-text-secondary text-center px-6">
            Enter the 6-character code shared by your family member below to start collaborating.
          </Text>
        </View>

        <View className="bg-white rounded-[32px] p-8 border border-border/50 shadow-sm">
          <RhfTextfield
            control={control}
            name="code"
            label="INVITE CODE"
            placeholder="E.G. AB12CD"
            autoCapitalize="characters"
            maxLength={6}
            transform={(text) => text.replace(/\s+/g, "").toUpperCase()}
            inputClassName="text-[20px] font-black tracking-[4px] text-center h-16"
          />

          <View className="mt-8">
            <PrimaryButton
              title="Join Family"
              onPress={handleSubmit(handleJoin)}
              icon={<ArrowRight size={20} stroke="#FFF" strokeWidth={2.5} />}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default JoinFamilyScreen;
