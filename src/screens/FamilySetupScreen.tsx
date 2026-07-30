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
import { useCreateFamily, useJoinFamily, useTextFormatter, useAppTheme } from "../hooks";
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
  let timeoutId: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
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

const FamilySetupScreen = ({ navigation }: any) => {
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
      navigation.reset({ index: 0, routes: [{ name: "Root" }] });
    }
  };

  const { colors } = useAppTheme();

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
      className={"w-full rounded-3xl border p-5 mb-4 " + borderClass}
      style={{ backgroundColor: colors.bgCard }}
    >
      <View className="flex-row items-center">
        <View className={"h-12 w-12 rounded-2xl items-center justify-center " + colorClass}>
          <Icon stroke="white" size={22} strokeWidth={2.5} />
        </View>
        <View className="ml-4 flex-1">
          <Text
            className="text-[17px] font-bold tracking-tight"
            style={{ color: colors.textPrimary }}
          >
            {title}
          </Text>
          <Text className="text-[13px] mt-1 leading-5" style={{ color: colors.textSecondary }}>
            {description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (mode === "selection") {
    const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Friend";
    const canGoBack = navigation?.canGoBack && navigation.canGoBack();

    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgCanvas }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="flex-1"
        >
          {/* Header Bar with perfect alignment */}
          <View className="px-5 pt-3 pb-2 flex-row justify-between items-center h-14">
            <View className="flex-row items-center gap-3">
              {canGoBack && (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="h-10 w-10 items-center justify-center rounded-full border"
                  style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
                >
                  <ArrowLeft stroke={colors.icon} size={18} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
              <View
                className="rounded-full border px-3.5 py-1.5"
                style={{ backgroundColor: colors.accentLightSubtle, borderColor: colors.border }}
              >
                <Text
                  className="text-[10px] font-bold uppercase tracking-[2px]"
                  style={{ color: colors.accent }}
                >
                  Family Grocery
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => signOut()}
              className="flex-row items-center px-3.5 py-2 rounded-full border h-10"
              style={{ backgroundColor: colors.badgeRoseBg, borderColor: colors.badgeRoseBorder }}
            >
              <LogOut stroke={colors.danger} size={14} strokeWidth={2.5} />
              <Text
                className="ml-1.5 font-bold text-[12px]"
                style={{ color: colors.badgeRoseText }}
              >
                Logout
              </Text>
            </TouchableOpacity>
          </View>

          <View className="px-5 mt-2">
            <View
              className="rounded-3xl border p-6"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
            >
              <Text
                className="text-[32px] font-black tracking-tight leading-tight"
                style={{ color: colors.textPrimary }}
              >
                One more step,
                {"\n"}
                {firstName}
              </Text>
              <Text className="text-[15px] mt-3 leading-6" style={{ color: colors.textSecondary }}>
                Create family group or join using invite code. After setup, list and members unlock.
              </Text>
            </View>

            <View className="mt-5">
              <SetupCard
                title="Create Family"
                description="Start group and share invite code with members."
                icon={Plus}
                onPress={() => setMode("create")}
                colorClass="bg-emerald-600"
                borderClass="border-emerald-100"
              />

              <SetupCard
                title="Join Family"
                description="Use 6-character invite code from family owner."
                icon={Users}
                onPress={() => setMode("join")}
                colorClass="bg-blue-600"
                borderClass="border-blue-100"
              />
            </View>

            <View
              className="mt-1 rounded-3xl border p-5"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
            >
              <Text
                className="text-[11px] font-bold uppercase tracking-[1.5px]"
                style={{ color: colors.accent }}
              >
                What You Get
              </Text>
              <View className="mt-4">
                <Text className="text-[14px]" style={{ color: colors.textSecondary }}>
                  • Shared grocery list in real time
                </Text>
                <Text className="mt-3 text-[14px]" style={{ color: colors.textSecondary }}>
                  • Track completion across members
                </Text>
                <Text className="mt-3 text-[14px]" style={{ color: colors.textSecondary }}>
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgCanvas }}>
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
          <View className="px-5 pt-3">
            {/* Balanced Clean Top Header Bar */}
            <View className="flex-row items-center justify-between h-12 mb-4">
              <TouchableOpacity
                onPress={() => {
                  setActionError(null);
                  setMode("selection");
                }}
                className="h-10 w-10 items-center justify-center rounded-full border"
                style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
              >
                <ArrowLeft stroke={colors.icon} size={18} strokeWidth={2.2} />
              </TouchableOpacity>

              <Text
                className="text-[17px] font-bold tracking-tight"
                style={{ color: colors.textPrimary }}
              >
                {mode === "create" ? "Create Family" : "Join Family"}
              </Text>

              {/* Spacer element for 3-point centered balance */}
              <View style={{ width: 40 }} />
            </View>

            {/* Segmented Mode Switcher Control */}
            <View
              className="flex-row rounded-2xl border p-1 mb-5"
              style={{ backgroundColor: colors.bgInput, borderColor: colors.border }}
            >
              <TouchableOpacity
                onPress={() => {
                  setActionError(null);
                  setMode("create");
                }}
                className={
                  "flex-1 py-2.5 rounded-xl items-center justify-center " +
                  (mode === "create" ? "bg-emerald-600" : "")
                }
              >
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: mode === "create" ? colors.white : colors.textMuted }}
                >
                  Create Family
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActionError(null);
                  setMode("join");
                }}
                className={
                  "flex-1 py-2.5 rounded-xl items-center justify-center " +
                  (mode === "join" ? "bg-emerald-600" : "")
                }
              >
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: mode === "join" ? colors.white : colors.textMuted }}
                >
                  Join Family
                </Text>
              </TouchableOpacity>
            </View>

            {/* Main Form Card */}
            <View
              className="rounded-3xl border p-6"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
            >
              <Text
                className="text-[26px] font-bold tracking-tight"
                style={{ color: colors.textPrimary }}
              >
                {mode === "create" ? "Create Family Group" : "Join Family Group"}
              </Text>
              <Text className="text-[14px] mt-2 leading-6" style={{ color: colors.textSecondary }}>
                {mode === "create"
                  ? "Create shared space for groceries, members, and live updates."
                  : "Enter invite code exactly as shared by family owner."}
              </Text>

              {mode === "create" ? (
                <View className="mt-6">
                  <Text
                    className="text-[13px] font-bold mb-2"
                    style={{ color: colors.textPrimary }}
                  >
                    Family Name
                  </Text>
                  <RhfTextfield
                    control={createForm.control}
                    name="familyName"
                    placeholder="The Smith Family"
                    autoCapitalize="words"
                    onChangeText={() => {
                      setFamilyNameError(null);
                      setActionError(null);
                    }}
                    containerClassName="rounded-2xl"
                    inputClassName="text-[17px] font-bold"
                    style={{ color: colors.textPrimary }}
                    autoFocus
                    placeholderTextColor={colors.iconMuted}
                  />
                  {familyNameError && (
                    <Text className="mt-2 ml-1 text-sm font-bold" style={{ color: colors.danger }}>
                      {familyNameError}
                    </Text>
                  )}

                  {actionError && (
                    <View
                      className="mt-3 rounded-xl border px-3 py-2"
                      style={{
                        backgroundColor: colors.badgeRoseBg,
                        borderColor: colors.badgeRoseBorder,
                      }}
                    >
                      <Text
                        className="text-[12px] font-semibold"
                        style={{ color: colors.badgeRoseText }}
                      >
                        {actionError}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handleCreateFamily}
                    disabled={loading || !toTrimmed(familyNameValue)}
                    className="mt-8 w-full py-4 rounded-2xl flex-row items-center justify-center"
                    style={{
                      backgroundColor: colors.accent,
                      opacity: !toTrimmed(familyNameValue) ? 0.4 : 1,
                    }}
                  >
                    <Text className="text-white font-bold text-lg">Create Family Group</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="mt-6">
                  <Text
                    className="text-[13px] font-bold mb-2"
                    style={{ color: colors.textPrimary }}
                  >
                    Invite Code
                  </Text>
                  <RhfTextfield
                    control={joinForm.control}
                    name="inviteCode"
                    placeholder="A B C 1 2 3"
                    transform={toInviteCode}
                    onChangeText={() => {
                      setInviteCodeError(null);
                      setActionError(null);
                    }}
                    containerClassName="rounded-2xl"
                    inputClassName="text-[28px] font-black text-center tracking-[5px]"
                    style={{ color: colors.accent }}
                    autoCapitalize="characters"
                    maxLength={6}
                    autoFocus
                    placeholderTextColor={colors.iconMuted}
                  />
                  <Text className="mt-2 text-[12px]" style={{ color: colors.textMuted }}>
                    6 characters. Letters and numbers.
                  </Text>

                  {inviteCodeError && (
                    <Text className="mt-2 text-sm font-bold" style={{ color: colors.danger }}>
                      {inviteCodeError}
                    </Text>
                  )}

                  {actionError && (
                    <View
                      className="mt-3 rounded-xl border px-3 py-2"
                      style={{
                        backgroundColor: colors.badgeRoseBg,
                        borderColor: colors.badgeRoseBorder,
                      }}
                    >
                      <Text
                        className="text-[12px] font-semibold"
                        style={{ color: colors.badgeRoseText }}
                      >
                        {actionError}
                      </Text>
                    </View>
                  )}

                  {/* Prominent, perfectly placed Join Family Group Submit Button */}
                  <TouchableOpacity
                    onPress={handleJoinFamily}
                    disabled={loading || normalizedInviteCodeValue.length < 6}
                    className="mt-8 w-full py-4 rounded-2xl flex-row items-center justify-center"
                    style={{
                      backgroundColor: colors.accent,
                      opacity: normalizedInviteCodeValue.length < 6 ? 0.4 : 1,
                    }}
                  >
                    <Text className="text-white font-bold text-lg">Join Family Group</Text>
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
