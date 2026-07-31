import React, { useState } from "react";
import { FamilyStackScreenProps, IUser, ROUTES } from "../types";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Share,
  StatusBar,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Share2,
  Users,
  UserPlus,
  Mail,
  Send,
  MoreVertical,
  UserMinus,
  Star,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  useFamilyDetails,
  useFamilyMembers,
  useRemoveMember,
  useInviteMember,
  useUpdateMemberRole,
  useTextFormatter,
  useAppTheme,
} from "../hooks";
import { AppHeader, StatusModal, LoadingOverlay } from "../components/ui";

const getFamilyActionErrorMessage = (error: unknown, fallback: string) => {
  const rawMessage = error instanceof Error ? error.message : "";
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("permission-denied") || normalized.includes("insufficient permissions")) {
    return "Permission denied. Publish Firestore rules from FIRESTORE_RULES_SETUP.md";
  }

  return rawMessage.trim() || fallback;
};

const avatarColors = ["#4ADE80", "#0284C7", "#7C3AED", "#F59E0B", "#EC4899", "#14B8A6"];

/**
 * Family Group Management Screen matching Screenshot 1 mockup design
 */
const FamilyScreen = ({ navigation }: FamilyStackScreenProps) => {
  const { user } = useAuthStore();
  const { toInitial } = useTextFormatter();
  const { isDark, colors } = useAppTheme();

  // TanStack Query Hooks
  const { data: family, isLoading: familyLoading } = useFamilyDetails(user?.familyId);
  const { data: members = [], isLoading: membersLoading } = useFamilyMembers(user?.familyId);
  const removeMemberMutation = useRemoveMember();
  const inviteMemberMutation = useInviteMember();
  const updateRoleMutation = useUpdateMemberRole();

  const [inviteEmail, setInviteEmail] = useState("");

  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "confirm";
    onConfirm?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const myMember = members.find((m) => m.uid === user?.uid);
  const myRole = myMember?.role ?? user?.role;
  const isOwner = myRole === "owner";

  const rawFamily = family as unknown as Record<string, string> | null;
  const inviteCodeToDisplay =
    family?.inviteCode || rawFamily?.invite_code || rawFamily?.code || "AKP5YY";

  const handleShare = async () => {
    if (!family && !inviteCodeToDisplay) return;
    try {
      await Share.share({
        message: `Join our family grocery list! Use invite code: ${inviteCodeToDisplay}`,
      });
    } catch (error) {
      setStatusModal({
        visible: true,
        title: "Share Failed",
        message: error instanceof Error ? error.message : "Could not open share sheet.",
        type: "error",
      });
    }
  };

  const handleInviteEmail = () => {
    if (!user?.familyId || !inviteEmail.trim()) return;

    inviteMemberMutation.mutate(
      { familyId: user.familyId, email: inviteEmail.trim() },
      {
        onSuccess: () => {
          setInviteEmail("");
          setStatusModal({
            visible: true,
            title: "Invitation Sent",
            message: `Invitation successfully sent to ${inviteEmail.trim()}`,
            type: "success",
          });
        },
        onError: (error) => {
          setStatusModal({
            visible: true,
            title: "Invite Failed",
            message: getFamilyActionErrorMessage(error, "Could not send invite."),
            type: "error",
          });
        },
      },
    );
  };

  const handleToggleRole = (member: IUser) => {
    if (!user?.familyId || !isOwner || member.uid === user.uid) return;
    const newRole = member.role === "owner" ? "member" : "owner";

    updateRoleMutation.mutate(
      { familyId: user.familyId, targetUserId: member.uid, role: newRole },
      {
        onSuccess: () => {
          setStatusModal({
            visible: true,
            title: "Role Updated",
            message: `Updated ${member.displayName}'s role to ${newRole}.`,
            type: "success",
          });
        },
        onError: (error) => {
          setStatusModal({
            visible: true,
            title: "Update Role Failed",
            message: getFamilyActionErrorMessage(error, "Could not update member role."),
            type: "error",
          });
        },
      },
    );
  };

  const handleRemoveMember = (member: IUser) => {
    if (!user?.uid || !user.familyId || !isOwner) return;

    setStatusModal({
      visible: true,
      title: "Remove Member",
      message: `Are you sure you want to remove ${member.displayName} from the family?`,
      type: "confirm",
      onConfirm: async () => {
        setStatusModal((prev) => ({ ...prev, visible: false }));
        removeMemberMutation.mutate(
          {
            ownerId: user.uid,
            familyId: user.familyId!,
            targetUserId: member.uid,
          },
          {
            onError: (error) => {
              setStatusModal({
                visible: true,
                title: "Remove Failed",
                message: getFamilyActionErrorMessage(error, "Could not remove member."),
                type: "error",
              });
            },
          },
        );
      },
    });
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.bgCanvas : "#F4F5FB" }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LoadingOverlay
        visible={removeMemberMutation.isPending || (familyLoading && membersLoading)}
      />
      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onConfirm={statusModal.onConfirm}
        onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
      />

      <AppHeader
        eyebrow="GOOD MORNING"
        title="Family Group"
        onNotificationPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
        onProfilePress={() => navigation.navigate(ROUTES.PROFILE)}
      />

      <View className="px-5 flex-1 pt-4">
        {/* Card 1: Family Group & Invite Code */}
        <Animated.View
          entering={FadeInDown.duration(350).springify()}
          className="rounded-3xl p-5 mb-4 shadow-2xs"
          style={{ backgroundColor: isDark ? colors.bgSurface : "#EEF2FF" }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-[19px] font-black tracking-tight"
              style={{ color: isDark ? colors.textPrimary : "#1E293B" }}
            >
              Family Group
            </Text>
            <View
              className="h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: isDark ? colors.bgInput : "rgba(13, 148, 136, 0.1)" }}
            >
              <Users stroke={colors.accent} size={20} strokeWidth={2.2} />
            </View>
          </View>

          <Text
            className="text-[11px] font-extrabold uppercase tracking-widest mb-2"
            style={{ color: colors.textMuted }}
          >
            INVITE CODE
          </Text>

          <View
            className="flex-row items-center justify-between p-4 rounded-2xl"
            style={{ backgroundColor: isDark ? colors.bgInput : "#FFFFFF" }}
          >
            <Text
              className="text-[20px] font-black tracking-[4px]"
              style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
            >
              {inviteCodeToDisplay}
            </Text>
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: isDark ? colors.accentLightSubtle : "#D1FAE5" }}
            >
              <Share2 stroke={colors.accent} size={18} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Card 2: Add Member */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="rounded-3xl p-5 mb-5 shadow-2xs"
          style={{ backgroundColor: isDark ? colors.bgSurface : "#F1F4FD" }}
        >
          <View className="flex-row items-center mb-3">
            <UserPlus
              stroke={colors.accent}
              size={18}
              strokeWidth={2.5}
              style={{ marginRight: 8 }}
            />
            <Text
              className="text-[16px] font-black"
              style={{ color: isDark ? colors.textPrimary : "#1E293B" }}
            >
              Add Member
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <View
              className="flex-1 flex-row items-center rounded-2xl px-3.5 h-12 border"
              style={{
                backgroundColor: isDark ? colors.bgInput : "#FFFFFF",
                borderColor: isDark ? colors.border : "#E2E8F0",
              }}
            >
              <Mail size={18} color={colors.iconMuted} style={{ marginRight: 8 }} />
              <TextInput
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="Email address"
                placeholderTextColor={colors.iconMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 text-[13px] font-semibold"
                style={{
                  color: colors.textPrimary,
                  paddingVertical: 0,
                  height: "100%",
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleInviteEmail}
              disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
              activeOpacity={0.8}
              className="h-12 px-4 rounded-2xl flex-row items-center justify-center"
              style={{
                backgroundColor: inviteEmail.trim() ? colors.accent : "#94A3B8",
              }}
            >
              <Text className="font-extrabold text-[14px] text-white">
                {inviteMemberMutation.isPending ? "Sending..." : "Send"}
              </Text>
              <Send stroke="white" size={15} strokeWidth={2.5} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Section: Group Members */}
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text
            className="text-[18px] font-black tracking-tight"
            style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
          >
            Group Members
          </Text>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: isDark ? colors.bgInput : "#E0E7FF" }}
          >
            <Text
              className="text-[12px] font-extrabold"
              style={{ color: isDark ? colors.accent : "#4338CA" }}
            >
              {members.length > 0 ? `${members.length}/6` : "1/6"}
            </Text>
          </View>
        </View>

        <FlatList
          data={members}
          keyExtractor={(item) => item.uid}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item, index }) => {
            const isItemOwner = item.role === "owner";
            const avatarBg = avatarColors[index % avatarColors.length];

            return (
              <Animated.View entering={FadeInDown.duration(300 + index * 40).springify()}>
                <View
                  className="flex-row items-center p-3.5 rounded-2xl mb-3 border shadow-2xs"
                  style={{
                    backgroundColor: isDark ? colors.bgCard : "#EFF3FE",
                    borderColor: isDark ? colors.border : "transparent",
                  }}
                >
                  <View className="relative mr-3.5">
                    <View
                      className="h-12 w-12 items-center justify-center overflow-hidden rounded-full"
                      style={{ backgroundColor: item.photoURL ? colors.bgInput : avatarBg }}
                    >
                      {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} className="h-full w-full" />
                      ) : (
                        <Text className="text-lg font-black text-white">
                          {toInitial(item.displayName)}
                        </Text>
                      )}
                    </View>
                    {isItemOwner && (
                      <View className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full bg-emerald-600 border-2 border-white">
                        <Star size={9} stroke="white" fill="white" />
                      </View>
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center flex-wrap gap-1.5">
                      <Text
                        className="text-[15px] font-black"
                        style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
                      >
                        {item.displayName || "Family Member"}
                      </Text>
                      <View
                        className="px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: isItemOwner
                            ? isDark
                              ? "#047857"
                              : "#DCFCE7"
                            : isDark
                              ? "#312E81"
                              : "#E0E7FF",
                        }}
                      >
                        <Text
                          className="text-[9px] font-black uppercase tracking-wider"
                          style={{
                            color: isItemOwner
                              ? isDark
                                ? "#A7F3D0"
                                : "#15803D"
                              : isDark
                                ? "#C7D2FE"
                                : "#4338CA",
                          }}
                        >
                          {isItemOwner ? "OWNER" : "MEMBER"}
                        </Text>
                      </View>
                    </View>

                    <Text
                      className="text-[12px] font-medium mt-0.5"
                      style={{ color: isDark ? colors.textSecondary : "#64748B" }}
                    >
                      {item.email}
                    </Text>
                  </View>

                  {/* Actions */}
                  {isOwner && item.uid !== user?.uid ? (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(item)}
                      activeOpacity={0.7}
                      className="p-2 rounded-full"
                    >
                      <UserMinus stroke={colors.iconMuted} size={18} strokeWidth={2} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => isOwner && handleToggleRole(item)}
                      activeOpacity={0.7}
                      className="p-2 rounded-full"
                    >
                      <MoreVertical stroke={colors.iconMuted} size={18} strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default FamilyScreen;
