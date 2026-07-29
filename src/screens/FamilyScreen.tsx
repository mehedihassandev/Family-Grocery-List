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
import { Share2, Crown, Trash2, Mail, UserCheck } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  useFamilyDetails,
  useFamilyMembers,
  useRemoveMember,
  useInviteMember,
  useUpdateMemberRole,
  useTextFormatter,
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

/**
 * Cardless Family Group Management Screen
 * Why: Pure white background, zero boxed cards, hairline list rows.
 */
const FamilyScreen = ({ navigation }: FamilyStackScreenProps) => {
  const { user } = useAuthStore();
  const { toInitial } = useTextFormatter();

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
    family?.inviteCode || rawFamily?.invite_code || rawFamily?.code || "------";

  const handleShare = async () => {
    if (!family) return;
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
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
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
        title="Family Group"
        eyebrow="Management"
        onNotificationPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
      />

      <View className="px-6 flex-1 bg-white">
        {/* Invite Code Section (Cardless with Breathing Space) */}
        <Animated.View
          entering={FadeInDown.duration(350).springify()}
          className="py-6 border-b border-slate-100"
        >
          <Text className="mb-3 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Invite Your Family
          </Text>
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Family Code
              </Text>
              <Text className="text-[32px] font-black tracking-[5px] text-slate-900">
                {inviteCodeToDisplay}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              className="h-11 w-11 items-center justify-center rounded-full bg-emerald-600 shadow-xs"
            >
              <Share2 stroke="white" size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Email Invite Action */}
          <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-100 px-3.5 py-1.5 h-12">
            <Mail size={17} color="#94A3B8" style={{ marginLeft: 2, marginRight: 8 }} />
            <TextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="Invite member by email..."
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 text-[13px] font-medium text-slate-800"
            />
            <TouchableOpacity
              onPress={handleInviteEmail}
              disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
              className={`px-4 py-2 rounded-lg ${
                inviteEmail.trim() ? "bg-emerald-600" : "bg-slate-200"
              }`}
            >
              <Text className="text-white font-extrabold text-[12px]">
                {inviteMemberMutation.isPending ? "Sending..." : "Invite"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Group Members List (Cardless Rows with Breathing Space) */}
        <View className="flex-row items-center justify-between pt-6 pb-3">
          <Text className="text-[18px] font-extrabold tracking-tight text-slate-900">
            Group Members
          </Text>
          <Text className="text-[12px] font-bold text-slate-400">{members.length} Total</Text>
        </View>

        <FlatList
          data={members}
          keyExtractor={(item) => item.uid}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(300 + index * 40).springify()}>
              <View className="flex-row items-center py-4 border-b border-slate-100">
                <View className="mr-3.5 h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-emerald-50 border border-emerald-100">
                  {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} className="h-full w-full" />
                  ) : (
                    <Text className="text-emerald-700 text-base font-black">
                      {toInitial(item.displayName)}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-extrabold text-slate-900">
                    {item.displayName || "Unknown User"} {item.uid === user?.uid ? "(You)" : ""}
                  </Text>
                  <Text className="text-[13px] text-slate-400 font-medium mt-0.5">
                    {item.email}
                  </Text>
                </View>

                <View className="flex-row items-center gap-1.5">
                  {isOwner && item.uid !== user?.uid && (
                    <TouchableOpacity
                      onPress={() => handleToggleRole(item)}
                      className="px-2 py-1 rounded-md flex-row items-center bg-purple-50"
                    >
                      <UserCheck size={10} color="#7C3AED" style={{ marginRight: 3 }} />
                      <Text className="text-[9px] font-extrabold uppercase text-purple-700">
                        {item.role === "owner" ? "Demote" : "Promote"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {item.role === "owner" ? (
                    <View className="px-2 py-1 rounded-md flex-row items-center bg-emerald-50">
                      <Crown stroke="#059669" size={10} strokeWidth={2.5} />
                      <Text className="ml-1 text-[9px] font-black uppercase text-emerald-700">
                        Owner
                      </Text>
                    </View>
                  ) : isOwner && item.uid !== user?.uid ? (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(item)}
                      activeOpacity={0.7}
                      className="h-8 w-8 items-center justify-center rounded-full bg-rose-50"
                    >
                      <Trash2 stroke="#EF4444" size={14} strokeWidth={2} />
                    </TouchableOpacity>
                  ) : (
                    <Text className="text-[9px] font-bold uppercase text-slate-400">Member</Text>
                  )}
                </View>
              </View>
            </Animated.View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default FamilyScreen;
