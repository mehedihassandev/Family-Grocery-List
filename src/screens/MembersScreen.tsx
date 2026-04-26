import React, { useEffect, useState } from "react";
import { MembersStackScreenProps } from "../types";
import { View, Text, FlatList, Image, TouchableOpacity, Share, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Share2, Crown, Trash2, LogOut } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  subscribeToFamilyMembers,
  getFamilyDetails,
  removeMemberAsOwner,
  leaveFamily,
} from "../services/family";
import { IUser, IFamily } from "../types";
import { AppHeader, Card, StatusModal, LoadingOverlay } from "../components/ui";
import NotificationModal from "../components/NotificationModal";

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
const MembersScreen = ({ navigation }: MembersStackScreenProps<"Members">) => {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<IUser[]>([]);
  const [family, setFamily] = useState<IFamily | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);

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

  useEffect(() => {
    if (!user?.familyId) return;

    getFamilyDetails(user.familyId).then(setFamily).catch(console.error);

    const unsubscribe = subscribeToFamilyMembers(
      user.familyId,
      (newMembers) => {
        setMembers(newMembers);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return () => unsubscribe();
  }, [user?.familyId]);

  /**
   * Opens the system share sheet with the family invite code
   */
  const handleShare = async () => {
    if (!family) return;
    try {
      await Share.share({
        message: `Join our family grocery list! Use invite code: ${family.inviteCode}`,
      });
    } catch (error) {
      console.error(error);
    }
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
        setActionLoading(true);
        try {
          await removeMemberAsOwner({
            ownerId: user.uid,
            familyId: user.familyId!,
            targetUserId: member.uid,
          });
        } catch (error) {
          setStatusModal({
            visible: true,
            title: "Remove Failed",
            message: getFamilyActionErrorMessage(error, "Could not remove member."),
            type: "error",
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  /**
   * Prompts the current user to leave the family
   */
  const handleLeaveFamily = () => {
    if (!user?.uid || !user.familyId) return;

    setStatusModal({
      visible: true,
      title: "Leave Family",
      message: isOwner
        ? "You are the owner. If you leave, ownership will be transferred to another member or the family will be deleted if you are the last one. Continue?"
        : "Are you sure you want to leave this family group?",
      type: "confirm",
      onConfirm: async () => {
        setStatusModal((prev) => ({ ...prev, visible: false }));
        setActionLoading(true);
        try {
          await leaveFamily({
            userId: user.uid,
            familyId: user.familyId!,
            role: myRole,
          });
        } catch (error) {
          setStatusModal({
            visible: true,
            title: "Leave Failed",
            message: getFamilyActionErrorMessage(error, "Could not leave family."),
            type: "error",
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <LoadingOverlay visible={actionLoading || (loading && members.length === 0)} />
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
        onNotificationPress={() => setNotifOpen(true)}
      />

      <View className="px-6 flex-1 pt-6">
        <Card className="mb-10 p-6 bg-primary-500/5 border-primary-500/10">
          <Text className="mb-4 text-[11px] font-bold uppercase tracking-[1.5px] text-primary-600">
            Invite Your Family
          </Text>
          <View className="flex-row items-center justify-between rounded-2xl bg-white border border-border/50 px-6 py-5 shadow-sm">
            <View>
              <Text className="text-[10px] font-bold text-text-muted uppercase tracking-[2px] mb-1">
                Family Code
              </Text>
              <Text className="text-[28px] font-black tracking-[4px] text-text-primary">
                {family?.inviteCode || "------"}
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
                      {item.displayName?.charAt(0).toUpperCase() || "?"}
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

                {item.role === "owner" ? (
                  <View className="bg-primary-500/10 px-3 py-1.5 rounded-lg flex-row items-center border border-primary-500/20">
                    <Crown stroke="#3DB87A" size={12} strokeWidth={3} />
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
            </Card>
          )}
        />

        <View className="py-4">
          <TouchableOpacity
            onPress={handleLeaveFamily}
            activeOpacity={0.8}
            className="flex-row items-center justify-center py-4 bg-white border border-danger-light rounded-2xl"
          >
            <LogOut stroke="#E55C5C" size={18} strokeWidth={2.5} />
            <Text className="ml-2 text-danger-dark font-bold text-[15px]">Leave Family Group</Text>
          </TouchableOpacity>
        </View>
      </View>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default MembersScreen;
