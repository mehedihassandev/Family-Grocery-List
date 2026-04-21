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
import { createFamily, joinFamily } from "../services/family";
import { signOut } from "../services/auth";
import { useAuthStore } from "../store/useAuthStore";

const FamilySetupScreen = () => {
  const { user, setUser } = useAuthStore();
  const [mode, setMode] = useState<"selection" | "create" | "join">(
    "selection",
  );
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateFamily = async () => {
    if (!familyName.trim() || !user) return;
    try {
      setLoading(true);
      const family = await createFamily(user.uid, familyName);
      setUser({ ...user, familyId: family.id, role: "owner" });
    } catch (error) {
      Alert.alert("Error", "Failed to create family group.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim() || !user) return;
    try {
      setLoading(true);
      const family = await joinFamily(user.uid, inviteCode);
      setUser({ ...user, familyId: family.id, role: "member" });
    } catch (error) {
      Alert.alert("Error", "Invalid invite code or family not found.");
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
            onPress={() => setMode("create")}
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
            onPress={() => setMode("join")}
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
            onPress={() => setMode("selection")}
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
                onChangeText={setFamilyName}
                className="w-full bg-surface-muted border border-border-muted p-4 rounded-2xl mb-6 text-lg text-text-primary"
                autoFocus
              />
              <TouchableOpacity
                onPress={handleCreateFamily}
                disabled={loading || !familyName.trim()}
                className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${loading || !familyName.trim() ? "bg-surface-subtle" : "bg-primary-600"}`}
              >
                {loading ? (
                  <ActivityIndicator color="#f6fbf7" />
                ) : (
                  <Text className="text-text-inverse font-bold text-lg">
                    Create Family
                  </Text>
                )}
              </TouchableOpacity>
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
                onChangeText={setInviteCode}
                className="w-full bg-surface-muted border border-border-muted p-4 rounded-2xl mb-6 text-lg tracking-widest text-center text-text-primary"
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />
              <TouchableOpacity
                onPress={handleJoinFamily}
                disabled={loading || inviteCode.length < 6}
                className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${loading || inviteCode.length < 6 ? "bg-surface-subtle" : "bg-primary-600"}`}
              >
                {loading ? (
                  <ActivityIndicator color="#f6fbf7" />
                ) : (
                  <Text className="text-text-inverse font-bold text-lg">
                    Join Family
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FamilySetupScreen;
