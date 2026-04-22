import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users, Plus, ArrowRight, LogOut } from "lucide-react-native";
import { FirebaseError } from "firebase/app";
import { createFamily, joinFamily } from "../services/family";
import { signOut } from "../services/auth";
import { useAuthStore } from "../store/useAuthStore";

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

const FamilySetupScreen = () => {
  const { user, setUser } = useAuthStore();
  const [mode, setMode] = useState<"selection" | "create" | "join">(
    "selection",
  );
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCreateFamily = async () => {
    const normalizedFamilyName = familyName.trim();
    if (!normalizedFamilyName || !user) return;

    try {
      setLoading(true);
      setActionError(null);
      console.log("[FamilySetup] createFamily:start", {
        uid: user.uid,
        familyName: normalizedFamilyName,
      });
      const family = await withFamilyActionTimeout(
        createFamily(user.uid, normalizedFamilyName),
        "Create family timed out after 15s. Check network/Firestore rules.",
      );
      console.log("[FamilySetup] createFamily:success", {
        familyId: family.id,
      });
      setUser({ ...user, familyId: family.id, role: "owner" });
    } catch (error) {
      console.error("[FamilySetup] createFamily:error", error);
      const errorMessage = getFamilyErrorMessage(error);
      setActionError(errorMessage);
      Alert.alert("Create Family Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    if (!normalizedInviteCode || !user) return;

    try {
      setLoading(true);
      setActionError(null);
      console.log("[FamilySetup] joinFamily:start", {
        uid: user.uid,
        inviteCode: normalizedInviteCode,
      });
      const family = await withFamilyActionTimeout(
        joinFamily(user.uid, normalizedInviteCode),
        "Join family timed out after 15s. Check network/Firestore rules.",
      );
      console.log("[FamilySetup] joinFamily:success", {
        familyId: family.id,
      });
      setUser({ ...user, familyId: family.id, role: "member" });
    } catch (error) {
      console.error("[FamilySetup] joinFamily:error", error);
      const errorMessage = getFamilyErrorMessage(error);
      setActionError(errorMessage);
      Alert.alert("Join Family Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (mode === "selection") {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-8 pt-4 items-end">
          <TouchableOpacity
            onPress={() => signOut()}
            className="flex-row items-center"
          >
            <View style={{ marginRight: 4 }}>
              <LogOut stroke="#c36262" size={16} />
            </View>
            <Text className="text-urgent font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-1 px-8 justify-center items-center">
          <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-6">
            <Users stroke="#59AC77" size={40} />
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
            <Text className="text-text-inverse font-bold text-lg">
              Create a New Family
            </Text>
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
            <Text className="text-primary-600 font-bold text-lg">
              Join Existing Family
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
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
              <Text className="text-3xl font-bold text-text-primary mb-2">
                New Family
              </Text>
              <Text className="text-text-secondary mb-8">
                Give your family group a name.
              </Text>
              <TextInput
                placeholder="Family Name (e.g. The Smiths)"
                value={familyName}
                onChangeText={(text) => {
                  setFamilyName(text);
                  if (actionError) setActionError(null);
                }}
                className="w-full bg-surface-muted border border-border-muted p-4 rounded-2xl mb-6 text-lg text-text-primary"
                autoFocus
              />
              <TouchableOpacity
                onPress={handleCreateFamily}
                disabled={loading || !familyName.trim()}
                className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${!familyName.trim() ? "bg-surface-subtle" : "bg-primary-600"}`}
              >
                {loading ? (
                  <ActivityIndicator color="#f6fbf7" />
                ) : (
                  <Text className="text-text-inverse font-bold text-lg">
                    Create Family
                  </Text>
                )}
              </TouchableOpacity>
              {actionError ? (
                <Text className="mt-3 text-sm text-urgent">{actionError}</Text>
              ) : null}
            </>
          ) : (
            <>
              <Text className="text-3xl font-bold text-text-primary mb-2">
                Join Family
              </Text>
              <Text className="text-text-secondary mb-8">
                Enter the 6-character invite code.
              </Text>
              <TextInput
                placeholder="Invite Code (e.g. AB1234)"
                value={inviteCode}
                onChangeText={(text) => {
                  setInviteCode(text.replace(/\s+/g, "").toUpperCase());
                  if (actionError) setActionError(null);
                }}
                className="w-full bg-surface-muted border border-border-muted p-4 rounded-2xl mb-6 text-lg tracking-widest text-center text-text-primary"
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleJoinFamily}
                disabled={loading || inviteCode.trim().length < 6}
                className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${inviteCode.trim().length < 6 ? "bg-surface-subtle" : "bg-primary-600"}`}
              >
                {loading ? (
                  <ActivityIndicator color="#f6fbf7" />
                ) : (
                  <Text className="text-text-inverse font-bold text-lg">
                    Join Family
                  </Text>
                )}
              </TouchableOpacity>
              {actionError ? (
                <Text className="mt-3 text-sm text-urgent">{actionError}</Text>
              ) : null}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FamilySetupScreen;
