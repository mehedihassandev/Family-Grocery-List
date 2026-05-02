import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users, Plus, ArrowRight, LogOut } from "lucide-react-native";
import { FirebaseError } from "firebase/app";
import { signOut } from "../services/auth";
import { useAuthStore } from "../store/useAuthStore";
import { useCreateFamily, useJoinFamily } from "../hooks/queries/useFamilyQueries";
import { useTextFormatter } from "../hooks";
import { AuthenticatedStackNavigatorScreenProps, ERootRoutes } from "../types";
import { LoadingOverlay, StatusModal } from "../components/ui";

const FAMILY_ACTION_TIMEOUT_MS = 15000;

/**
 * Maps family operation errors to user-friendly messages
 * @param error - The error object
 */
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
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Initial setup screen for users not yet in a family
 * Why: To guide users through creating or joining a family group immediately after signup.
 */
const FamilySetupScreen = ({
  navigation,
  route,
}: AuthenticatedStackNavigatorScreenProps<ERootRoutes.FAMILY_SETUP>) => {
  const { user, setUser } = useAuthStore();
  const { toTrimmed, toInviteCode } = useTextFormatter();
  const [mode, setMode] = useState<"selection" | "create" | "join">(
    route.params?.mode ?? "selection",
  );
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });
  // Inline field-level errors guide the user without using an Alert dialog
  const [familyNameError, setFamilyNameError] = useState<string | null>(null);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);

  // TanStack Query Mutations
  const createMutation = useCreateFamily();
  const joinMutation = useJoinFamily();

  const loading = createMutation.isPending || joinMutation.isPending;

  useEffect(() => {
    if (!route.params?.mode) {
      return;
    }
    setMode(route.params.mode);
  }, [route.params?.mode]);

  /**
   * Handles creating a new family group
   */
  const handleCreateFamily = async () => {
    const normalizedFamilyName = toTrimmed(familyName);

    // Show inline error instead of silently ignoring the tap
    if (!normalizedFamilyName) {
      setFamilyNameError("Family name cannot be empty.");
      return;
    }
    if (!user?.uid) {
      setStatusModal({
        visible: true,
        title: "Create Family Failed",
        message: "Session not ready. Please wait and try again.",
      });
      return;
    }

    setActionError(null);
    try {
      const family = await withFamilyActionTimeout(
        createMutation.mutateAsync({ userId: user.uid, familyName: normalizedFamilyName }),
        "Create timed out. Check network and Firestore rules, then try again.",
      );
      setUser({ ...user, familyId: family.id, role: "owner" });
      navigation.reset({
        index: 0,
        routes: [{ name: "Root" }],
      });
    } catch (error) {
      const errorMessage = getFamilyErrorMessage(error);
      setActionError(errorMessage);
      setStatusModal({
        visible: true,
        title: "Create Family Failed",
        message: errorMessage,
      });
    }
  };

  /**
   * Handles joining an existing family group
   */
  const handleJoinFamily = async () => {
    const normalizedInviteCode = toInviteCode(inviteCode);

    // Show inline error instead of silently ignoring the tap
    if (!normalizedInviteCode) {
      setInviteCodeError("Invite code cannot be empty.");
      return;
    }
    if (normalizedInviteCode.length < 6) {
      setInviteCodeError("Invite code must be exactly 6 characters.");
      return;
    }
    if (!user?.uid) {
      setStatusModal({
        visible: true,
        title: "Join Family Failed",
        message: "Session not ready. Please wait and try again.",
      });
      return;
    }

    setActionError(null);
    try {
      const family = await withFamilyActionTimeout(
        joinMutation.mutateAsync({ userId: user.uid, inviteCode: normalizedInviteCode }),
        "Join timed out. Check network and Firestore rules, then try again.",
      );
      setUser({ ...user, familyId: family.id, role: "member" });
      navigation.reset({
        index: 0,
        routes: [{ name: "Root" }],
      });
    } catch (error) {
      const errorMessage = getFamilyErrorMessage(error);
      setActionError(errorMessage);
      setStatusModal({
        visible: true,
        title: "Join Family Failed",
        message: errorMessage,
      });
    }
  };

  if (mode === "selection") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-8 pt-4 items-end">
          <TouchableOpacity onPress={() => signOut()} className="flex-row items-center">
            <View style={{ marginRight: 4 }}>
              <LogOut stroke="#c36262" size={16} />
            </View>
            <Text className="text-urgent font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 px-8 justify-center items-center">
          <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-6">
            <Users stroke="#10B981" size={40} />
          </View>
          <Text className="text-3xl font-bold text-text-primary text-center mb-2">
            Welcome, {user?.displayName}
          </Text>
          <Text className="text-lg text-text-secondary text-center mb-12">
            How would you like to start?
          </Text>

          <TouchableOpacity
            onPress={() => {
              setActionError(null);
              setMode("create");
            }}
            className="w-full bg-primary-600 py-4 rounded-2xl mb-4 flex-row items-center justify-center"
          >
            <View style={{ marginRight: 8 }}>
              <Plus stroke="white" size={20} />
            </View>
            <Text className="text-text-inverse font-bold text-lg">Create a New Family</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActionError(null);
              setMode("join");
            }}
            className="w-full bg-surface border border-primary-600 py-4 rounded-2xl flex-row items-center justify-center"
          >
            <View style={{ marginRight: 8 }}>
              <ArrowRight stroke="#637889" size={20} />
            </View>
            <Text className="text-primary-600 font-bold text-lg">Join Existing Family</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <LoadingOverlay visible={loading} />
      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type="error"
        onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-8 justify-center">
          <TouchableOpacity
            onPress={() => {
              setActionError(null);
              setMode("selection");
            }}
            className="mb-8"
          >
            <Text className="text-primary-600 font-semibold">← Back</Text>
          </TouchableOpacity>

          {mode === "create" ? (
            <>
              <Text className="text-3xl font-bold text-text-primary mb-2">New Family</Text>
              <Text className="text-text-secondary mb-8">Give your family group a name.</Text>
              <TextInput
                placeholder="Family Name (e.g. The Smiths)"
                value={familyName}
                onChangeText={(text) => {
                  setFamilyName(text);
                  // Clear errors as soon as the user starts typing
                  if (actionError) setActionError(null);
                  if (familyNameError) setFamilyNameError(null);
                }}
                className="w-full bg-surface-muted border border-border-muted p-4 rounded-2xl mb-2 text-lg text-text-primary"
                autoFocus
              />
              {familyNameError ? (
                <Text className="mb-4 ml-1 text-sm text-urgent">{familyNameError}</Text>
              ) : (
                <View className="mb-4" />
              )}
              <TouchableOpacity
                onPress={handleCreateFamily}
                disabled={loading || !familyName.trim()}
                className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${!familyName.trim() ? "bg-surface-subtle" : "bg-primary-600"}`}
              >
                {loading ? (
                  <ActivityIndicator color="#f6fbf7" />
                ) : (
                  <Text className="text-text-inverse font-bold text-lg">Create Family</Text>
                )}
              </TouchableOpacity>
              {actionError ? <Text className="mt-3 text-sm text-urgent">{actionError}</Text> : null}
            </>
          ) : (
            <>
              <Text className="text-3xl font-bold text-text-primary mb-2">Join Family</Text>
              <Text className="text-text-secondary mb-8">Enter the 6-character invite code.</Text>
              <TextInput
                placeholder="Invite Code (e.g. AB1234)"
                value={inviteCode}
                onChangeText={(text) => {
                  setInviteCode(toInviteCode(text));
                  // Clear errors as soon as the user starts typing
                  if (actionError) setActionError(null);
                  if (inviteCodeError) setInviteCodeError(null);
                }}
                className="w-full bg-surface-muted border border-border-muted p-4 rounded-2xl mb-2 text-lg tracking-widest text-center text-text-primary"
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />
              {inviteCodeError ? (
                <Text className="mb-4 ml-1 text-sm text-urgent">{inviteCodeError}</Text>
              ) : (
                <View className="mb-4" />
              )}
              <TouchableOpacity
                onPress={handleJoinFamily}
                disabled={loading || toInviteCode(inviteCode).length < 6}
                className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${toInviteCode(inviteCode).length < 6 ? "bg-surface-subtle" : "bg-primary-600"}`}
              >
                {loading ? (
                  <ActivityIndicator color="#f6fbf7" />
                ) : (
                  <Text className="text-text-inverse font-bold text-lg">Join Family</Text>
                )}
              </TouchableOpacity>
              {actionError ? <Text className="mt-3 text-sm text-urgent">{actionError}</Text> : null}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FamilySetupScreen;
