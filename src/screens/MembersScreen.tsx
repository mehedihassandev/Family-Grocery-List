import React, { useState } from "react";
import { ERootRoutes, MembersStackScreenProps, IUser } from "../types";
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
import { AppHeader, Card, StatusModal, LoadingOverlay } from "../components/ui";

/**
 * Maps family-related operation errors to user-friendly messages
 * @param error - The error object
 * @param fallback - The default message if error is unknown
 */
const getFamilyActionErrorMessage = (error: unknown, fallback: string) => {
  const rawMessage = error instanceof Error ? error.message : "";
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("permission-denied") || normalized.includes("insufficient permissions")) {
    return "Permission denied. Publish Firestore rules from FIRESTORE_RULES_SETUP.md";
  }

  return rawMessage.trim() || fallback;
};

/**
 * Premium Family Members Management Screen
 * Why: To provide a high-fidelity experience for managing family groups with elegant feedback.
 */
const MembersScreen = ({ navigation }: MembersStackScreenProps) => {
  const { user } = useAuthStore();
  const { toInitial } = useTextFormatter();

  // TanStack Query Hooks
  const { data: family, isLoading: familyLoading } = useFamilyDetails(user?.familyId);
  const { data: members = [], isLoading: membersLoading } = useFamilyMembers(user?.familyId);
  const removeMemberMutation = useRemoveMember();
  const inviteMemberMutation = useInviteMember();
  const updateRoleMutation = useUpdateMemberRole();

  const [inviteEmail, setInviteEmail] = useState("");

  // Modal states
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

  /**
   * Opens the system share sheet with the family invite code
   */
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

  /**
   * Invites a member via email address API
   */
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

  /**
   * Updates a member's role (owner vs member) via API
   */
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

  /**
   * Prompts to remove a member from the family (Owner only)
   * @param member - The user to remove
   */
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
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
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
        onNotificationPress={() => navigation.navigate(ERootRoutes.NOTIFICATIONS)}
      />

      <View className="px-6 flex-1 pt-6">
        <Card className="mb-10 p-6 bg-primary-500/5 border-primary-500/10">
          <Text className="mb-4 text-[11px] font-bold uppercase tracking-[1.5px] text-primary-600">
            Invite Your Family
          </Text>
          <View className="flex-row items-center justify-between rounded-2xl bg-white border border-border/50 px-6 py-5 shadow-sm mb-4">
            <View>
              <Text className="text-[10px] font-bold text-text-muted uppercase tracking-[2px] mb-1">
                Family Code
              </Text>
              <Text className="text-[28px] font-black tracking-[4px] text-text-primary">
                {inviteCodeToDisplay}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              className="h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/30"
            >
              <Share2 stroke="white" size={22} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Email Invite REST API Action */}
          <View className="flex-row items-center bg-white rounded-2xl border border-border/50 px-3 py-2">
            <Mail size={18} color="#94A3B8" style={{ marginLeft: 6, marginRight: 8 }} />
            <TextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="Invite member by email..."
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 text-sm font-medium text-slate-800 h-10"
            />
            <TouchableOpacity
              onPress={handleInviteEmail}
              disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
              className={`px-4 py-2 rounded-xl ${
                inviteEmail.trim() ? "bg-primary-600" : "bg-slate-200"
              }`}
            >
              <Text className="text-white font-bold text-xs">
                {inviteMemberMutation.isPending ? "Sending..." : "Invite"}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-[20px] font-bold tracking-tight text-text-primary">
            Group Members
          </Text>
          <View className="rounded-full bg-surface-alt px-3 py-1 border border-border">
            <Text className="text-[11px] font-bold text-text-muted">{members.length} Total</Text>
          </View>
        </View>

        <FlatList
          data={members}
          keyExtractor={(item) => item.uid}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <Card className="mb-4 p-5">
              <View className="flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-primary-50 border border-primary-100">
                  {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} className="h-full w-full" />
                  ) : (
                    <Text className="text-primary-600 text-lg font-black">
                      {toInitial(item.displayName)}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] font-bold text-text-primary">
                    {item.displayName || "Unknown User"} {item.uid === user?.uid ? "(You)" : ""}
                  </Text>
                  <Text className="text-[12px] text-text-muted font-medium mt-0.5">
                    {item.email}
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  {isOwner && item.uid !== user?.uid && (
                    <TouchableOpacity
                      onPress={() => handleToggleRole(item)}
                      className="bg-purple-50 px-2.5 py-1.5 rounded-lg flex-row items-center border border-purple-200"
                    >
                      <UserCheck size={12} color="#8B5CF6" style={{ marginRight: 4 }} />
                      <Text className="text-[10px] font-extrabold uppercase text-purple-700">
                        {item.role === "owner" ? "Demote" : "Promote"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {item.role === "owner" ? (
                    <View className="bg-primary-500/10 px-3 py-1.5 rounded-lg flex-row items-center border border-primary-500/20">
                      <Crown stroke="#10B981" size={12} strokeWidth={3} />
                      <Text className="ml-1.5 text-[10px] font-black uppercase tracking-widest text-primary-600">
                        Owner
                      </Text>
                    </View>
                  ) : isOwner && item.uid !== user?.uid ? (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(item)}
                      activeOpacity={0.7}
                      className="h-10 w-10 items-center justify-center rounded-xl bg-danger-light border border-danger/20"
                    >
                      <Trash2 stroke="#E55C5C" size={18} strokeWidth={2.5} />
                    </TouchableOpacity>
                  ) : (
                    <View className="bg-surface-muted px-3 py-1.5 rounded-lg border border-border/50">
                      <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Member
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default MembersScreen;
