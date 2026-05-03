import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { Users, Plus, ArrowLeft, LogOut } from "lucide-react-native";
import { FirebaseError } from "firebase/app";
import { signOut } from "../services/auth";
import { useAuthStore } from "../store/useAuthStore";
import { useCreateFamily, useJoinFamily } from "../hooks/queries/useFamilyQueries";
import { useTextFormatter } from "../hooks";
import { goToAuthenticatedRoot } from "../navigation/navigationRef";
import { LoadingOverlay, RhfTextfield, StatusModal } from "../components/ui";

const FAMILY_ACTION_TIMEOUT_MS = 15000;
type FamilySetupMode = "selection" | "create" | "join";
type SetupCardProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ stroke: string; size: number; strokeWidth: number }>;
  onPress: () => void;
  colorClass: string;
  borderClass: string;
};
type FamilyErrorLike = FirebaseError | Error | { code?: string; message?: string } | null;
type FamilyActionResult = { id: string };
type CreateFamilyFormValues = { familyName: string };
type JoinFamilyFormValues = { inviteCode: string };

const getFamilyErrorMessage = (error: FamilyErrorLike) => {
  if (error && typeof error === "object" && "code" in error && error.code) {
    switch (error.code) {
      case "permission-denied":
        return "Permission denied by Firestore rules.";
      case "unavailable":
        return "Network unavailable. Try again.";
      case "failed-precondition":
        return "Firestore index/rules are not ready.";
    }
  }
  if (error && error.message) {
    return error.message.trim();
  }
  return "Unexpected error. Try again.";
};

async function withFamilyActionTimeout<T>(operation: Promise<T>, timeoutMessage: string) {
  let timeoutId;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
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
  const { toTrimmed, toInviteCode } = useTextFormatter();
  const [mode, setMode] = useState<FamilySetupMode>("selection");
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "error" as "error" | "success",
  });
  const [familyNameError, setFamilyNameError] = useState<string | null>(null);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);

  const createMutation = useCreateFamily();
  const joinMutation = useJoinFamily();
  const createForm = useForm<CreateFamilyFormValues>({
    defaultValues: { familyName: "" },
  });
  const joinForm = useForm<JoinFamilyFormValues>({
    defaultValues: { inviteCode: "" },
  });
  const familyNameValue = createForm.watch("familyName");
  const inviteCodeValue = joinForm.watch("inviteCode");
  const normalizedInviteCodeValue = toInviteCode(inviteCodeValue);

  const loading = createMutation.isPending || joinMutation.isPending;

  const handleCreateFamily = async () => {
    const normalizedFamilyName = toTrimmed(createForm.getValues("familyName"));
    if (!normalizedFamilyName) {
      setFamilyNameError("Family name cannot be empty.");
      return;
    }
    if (!user?.uid) return;

    setActionError(null);
    try {
      const family = (await withFamilyActionTimeout(
        createMutation.mutateAsync({ userId: user.uid, familyName: normalizedFamilyName }),
        "Create timed out. Check network and try again.",
      )) as FamilyActionResult;
      setUser({ ...user, familyId: family.id, role: "owner" });
      setStatusModal({
        visible: true,
        title: "Family Created!",
        message: "Your family group is ready. Welcome aboard!",
        type: "success",
      });
    } catch (error) {
      const errorMessage = getFamilyErrorMessage(error as FamilyErrorLike);
      setActionError(errorMessage);
      setStatusModal({
        visible: true,
        title: "Creation Failed",
        message: errorMessage,
        type: "error",
      });
    }
  };

  const handleJoinFamily = async () => {
    const normalizedInviteCode = toInviteCode(joinForm.getValues("inviteCode"));
    if (!normalizedInviteCode || normalizedInviteCode.length < 6) {
      setInviteCodeError("Please enter a valid 6-character code.");
      return;
    }
    if (!user?.uid) return;

    setActionError(null);
    try {
      const family = (await withFamilyActionTimeout(
        joinMutation.mutateAsync({ userId: user.uid, inviteCode: normalizedInviteCode }),
        "Join timed out. Check network and try again.",
      )) as FamilyActionResult;
      setUser({ ...user, familyId: family.id, role: "member" });
      setStatusModal({
        visible: true,
        title: "Successfully Joined!",
        message: "You have joined the family group. Happy shopping!",
        type: "success",
      });
    } catch (error) {
      const errorMessage = getFamilyErrorMessage(error as FamilyErrorLike);
      setActionError(errorMessage);
      setStatusModal({
        visible: true,
        title: "Join Failed",
        message: errorMessage,
        type: "error",
      });
    }
  };

  const handleStatusModalClose = () => {
    const isSuccess = statusModal.type === "success";
    setStatusModal((prev) => ({ ...prev, visible: false }));
    if (isSuccess) {
      goToAuthenticatedRoot();
    }
  };

  const SetupCard = ({
    title,
    description,
    icon: Icon,
    onPress,
    colorClass,
    borderClass,
  }: SetupCardProps) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className={"w-full rounded-[28px] bg-white border p-5 mb-4 " + borderClass}
    >
      <View className="flex-row items-center">
        <View className={"h-12 w-12 rounded-xl items-center justify-center " + colorClass}>
          <Icon stroke="white" size={22} strokeWidth={2.5} />
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-[18px] font-bold text-text-primary tracking-tight">{title}</Text>
          <Text className="text-[13px] text-text-secondary mt-1 leading-5">{description}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (mode === "selection") {
    const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Friend";
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          <View className="px-6 py-4 flex-row justify-between items-center">
            <View className="rounded-full bg-primary-50 border border-primary-100 px-3 py-1.5">
              <Text className="text-[10px] font-bold uppercase tracking-[2px] text-primary-700">
                Family Grocery
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => signOut()}
              className="flex-row items-center bg-danger-light px-4 py-2 rounded-full border border-danger/20"
            >
              <LogOut stroke="#E55C5C" size={14} strokeWidth={3} />
              <Text className="ml-2 text-danger-dark font-bold text-[12px]">Logout</Text>
            </TouchableOpacity>
          </View>

          <View className="px-6 mt-2">
            <View className="rounded-[28px] border border-primary-100 bg-primary-50/40 p-6">
              <Text className="text-[34px] font-black text-text-primary tracking-tight leading-tight">
                One more step,
                {"\n"}
                {firstName}
              </Text>
              <Text className="text-[15px] text-text-secondary mt-3 leading-6">
                Create family group or join using invite code. After setup, list and members unlock.
              </Text>
            </View>

            <View className="mt-6">
              <SetupCard
                title="Create Family"
                description="Start group and share invite code with members."
                icon={Plus}
                onPress={() => setMode("create")}
                colorClass="bg-primary-600"
                borderClass="border-primary-100"
              />

              <SetupCard
                title="Join Family"
                description="Use 6-character invite code from family owner."
                icon={Users}
                onPress={() => setMode("join")}
                colorClass="bg-info-DEFAULT"
                borderClass="border-info-light"
              />
            </View>

            <View className="mt-3 rounded-[24px] border border-border bg-white p-5">
              <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-primary-600">
                What You Get
              </Text>
              <View className="mt-4">
                <Text className="text-[14px] text-text-secondary">
                  • Shared grocery list in real time
                </Text>
                <Text className="mt-3 text-[14px] text-text-secondary">
                  • Track completion across members
                </Text>
                <Text className="mt-3 text-[14px] text-text-secondary">
                  • Family invite code with owner control
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
        type={statusModal.type}
        onClose={handleStatusModalClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          className="flex-1"
        >
          <View className="px-6 pt-4">
            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity
                onPress={() => {
                  setActionError(null);
                  setMode("selection");
                }}
                className="h-11 w-11 items-center justify-center rounded-xl bg-white border border-border"
              >
                <ArrowLeft stroke="#4A5568" size={20} strokeWidth={2.5} />
              </TouchableOpacity>

              <View className="flex-row rounded-full bg-surface-muted border border-border p-1">
                <TouchableOpacity
                  onPress={() => setMode("create")}
                  className={
                    "px-4 py-2 rounded-full " + (mode === "create" ? "bg-primary-600" : "")
                  }
                >
                  <Text
                    className={
                      "text-[12px] font-bold " +
                      (mode === "create" ? "text-white" : "text-text-muted")
                    }
                  >
                    Create
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMode("join")}
                  className={"px-4 py-2 rounded-full " + (mode === "join" ? "bg-primary-600" : "")}
                >
                  <Text
                    className={
                      "text-[12px] font-bold " +
                      (mode === "join" ? "text-white" : "text-text-muted")
                    }
                  >
                    Join
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="rounded-[28px] border border-border bg-white p-6">
              <Text className="text-[28px] font-bold text-text-primary tracking-tight">
                {mode === "create" ? "Create Family Group" : "Join Family Group"}
              </Text>
              <Text className="text-[15px] text-text-secondary mt-2 leading-6">
                {mode === "create"
                  ? "Create shared space for groceries, members, and live updates."
                  : "Enter invite code exactly as shared by family owner."}
              </Text>

              {mode === "create" ? (
                <View className="mt-6">
                  <Text className="text-[13px] font-bold text-text-primary mb-2">Family Name</Text>
                  <RhfTextfield
                    control={createForm.control}
                    name="familyName"
                    placeholder="The Smith Family"
                    autoCapitalize="words"
                    onChangeText={(text) => {
                      setFamilyNameError(null);
                      setActionError(null);
                    }}
                    containerClassName="rounded-2xl"
                    inputClassName="text-[17px] font-bold text-text-primary"
                    autoFocus
                    placeholderTextColor="#9AA3AF"
                  />
                  {familyNameError && (
                    <Text className="mt-2 ml-1 text-sm font-bold text-danger-dark">
                      {familyNameError}
                    </Text>
                  )}

                  {actionError && (
                    <View className="mt-3 rounded-xl border border-danger/25 bg-danger-light px-3 py-2">
                      <Text className="text-[12px] font-semibold text-danger-dark">
                        {actionError}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handleCreateFamily}
                    disabled={loading || !toTrimmed(familyNameValue)}
                    className={
                      "mt-8 w-full py-4 rounded-2xl flex-row items-center justify-center " +
                      (!toTrimmed(familyNameValue) ? "bg-primary-200" : "bg-primary-600")
                    }
                  >
                    <Text className="text-white font-bold text-lg">Create Family</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="mt-6">
                  <Text className="text-[13px] font-bold text-text-primary mb-2">Invite Code</Text>
                  <RhfTextfield
                    control={joinForm.control}
                    name="inviteCode"
                    placeholder="A B C 1 2 3"
                    transform={toInviteCode}
                    onChangeText={(text) => {
                      setInviteCodeError(null);
                      setActionError(null);
                    }}
                    containerClassName="rounded-2xl"
                    inputClassName="text-[28px] font-black text-center tracking-[5px] text-primary-700"
                    autoCapitalize="characters"
                    maxLength={6}
                    autoFocus
                    placeholderTextColor="#C0C8D2"
                  />
                  <Text className="mt-2 text-[12px] text-text-muted">
                    6 characters. Letters and numbers.
                  </Text>

                  {inviteCodeError && (
                    <Text className="mt-2 text-sm font-bold text-danger-dark">
                      {inviteCodeError}
                    </Text>
                  )}

                  {actionError && (
                    <View className="mt-3 rounded-xl border border-danger/25 bg-danger-light px-3 py-2">
                      <Text className="text-[12px] font-semibold text-danger-dark">
                        {actionError}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handleJoinFamily}
                    disabled={loading || normalizedInviteCodeValue.length < 6}
                    className={
                      "mt-8 w-full py-4 rounded-2xl flex-row items-center justify-center " +
                      (normalizedInviteCodeValue.length < 6 ? "bg-primary-200" : "bg-primary-600")
                    }
                  >
                    <Text className="text-white font-bold text-lg">Join Family</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FamilySetupScreen;
