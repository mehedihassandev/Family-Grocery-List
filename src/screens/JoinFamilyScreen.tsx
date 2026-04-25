import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Users } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FirebaseError } from "firebase/app";
import { SubHeader, RhfTextfield } from "../components/ui";
import type { RootStackNavigationProp } from "../types";
import { joinFamily } from "../services/family";
import { useAuthStore } from "../store/useAuthStore";
import { joinFamilySchema, type JoinFamilyFormValues } from "../utils/validationSchemas";

const FAMILY_ACTION_TIMEOUT_MS = 15000;

const getFamilyErrorMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "permission-denied":
        return "Permission denied by Firestore rules.";
      case "unavailable":
        return "Network unavailable. Try again.";
      case "failed-precondition":
        return "Firestore index/rules are not ready.";
      default:
        return error.message || "Unexpected Firestore error.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Unexpected error. Try again.";
};

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
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

const JoinFamilyScreen = () => {
  // Typed navigation — mistyped route names are caught at compile time.
  const navigation = useNavigation<RootStackNavigationProp>();
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuthStore();

  const { control, handleSubmit, setError, clearErrors } = useForm<JoinFamilyFormValues>({
    resolver: yupResolver(joinFamilySchema),
    mode: "onTouched",
    defaultValues: { code: "" },
  });

  /**
   * Handles joining a family by invite code after Yup validation passes.
   * Values are guaranteed to be exactly 6 uppercase alphanumeric characters.
   *
   * @param values - Validated form values
   */
  const handleJoin = async (values: JoinFamilyFormValues) => {
    setLoading(true);
    try {
      clearErrors("code");

      if (!user?.uid) {
        throw new Error("You must be signed in to join a family.");
      }

      const family = await withFamilyActionTimeout(
        joinFamily(user.uid, values.code),
        "Join family timed out after 15s. Check network/Firestore rules.",
      );

      setUser({ ...user, familyId: family.id, role: "member" });
      navigation.goBack();
    } catch (error) {
      const message = getFamilyErrorMessage(error);

      if (message.toLowerCase().includes("invalid invite code")) {
        setError("code", { type: "manual", message });
        return;
      }

      Alert.alert("Join Family Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <SubHeader title="Join Family" />

      <View className="p-6">
        <View className="items-center mb-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 mb-4">
            <Users stroke="#3DB87A" size={32} />
          </View>
          <Text className="text-[24px] font-black text-text-primary mb-2 text-center">
            Got an Invite Code?
          </Text>
          <Text className="text-[15px] text-text-secondary text-center px-4">
            Paste the invite code shared by your family member below to join their existing list.
          </Text>
        </View>

        <RhfTextfield
          control={control}
          name="code"
          label="INVITE CODE"
          placeholder="e.g. ABC123"
          autoCapitalize="characters"
          maxLength={6}
          transform={(text) => text.replace(/\s+/g, "").toUpperCase()}
          inputClassName="text-[18px] font-bold tracking-widest text-center"
        />

        <View className="mb-6" />

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={loading}
          onPress={handleSubmit(handleJoin)}
          className={`py-4 rounded-2xl items-center ${loading ? "bg-primary-300" : "bg-primary-600"}`}
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
