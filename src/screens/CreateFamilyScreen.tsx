import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { PlusCircle } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FirebaseError } from "firebase/app";
import { SubHeader, RhfTextfield } from "../components/ui";
import type { RootStackNavigationProp } from "../types";
import { createFamily } from "../services/family";
import { useAuthStore } from "../store/useAuthStore";
import { createFamilySchema, type CreateFamilyFormValues } from "../utils/validationSchemas";

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

const CreateFamilyScreen = () => {
  // Typed navigation eliminates the need for `useNavigation<any>()`;
  // any incorrect route name would now be a compile-time error.
  const navigation = useNavigation<RootStackNavigationProp>();
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuthStore();

  const { control, handleSubmit } = useForm<CreateFamilyFormValues>({
    resolver: yupResolver(createFamilySchema),
    mode: "onTouched",
    defaultValues: { name: "" },
  });

  /**
   * Handles family creation after Yup validation has passed.
   * Values are guaranteed valid here — no extra guard needed.
   *
   * @param values - Validated form values
   */
  const handleCreate = async (values: CreateFamilyFormValues) => {
    setLoading(true);
    try {
      if (!user?.uid) {
        throw new Error("You must be signed in to create a family.");
      }

      const family = await withFamilyActionTimeout(
        createFamily(user.uid, values.name),
        "Create family timed out after 15s. Check network/Firestore rules.",
      );

      setUser({ ...user, familyId: family.id, role: "owner" });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Create Family Failed", getFamilyErrorMessage(error));
    } finally {
      setLoading(false);
    }
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

        <RhfTextfield
          control={control}
          name="name"
          label="FAMILY NAME"
          placeholder="e.g. The Smiths, Our Home"
          inputClassName="text-[18px] font-bold"
        />

        <View className="mb-6" />

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={loading}
          onPress={handleSubmit(handleCreate)}
          className={`py-4 rounded-2xl items-center ${loading ? "bg-primary-300" : "bg-primary-600"}`}
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
