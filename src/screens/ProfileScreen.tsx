import React, { useState } from "react";
import { ProfileStackScreenProps } from "../types";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Shield, HelpCircle, ChevronRight, Edit3, Users } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { signOut } from "../services/auth";
import { leaveFamily } from "../services/family";
import { useTextFormatter } from "../hooks";
import { AppHeader, Card, StatusModal } from "../components/ui";
import { ERootRoutes, ETabRoutes } from "../navigation/routes";

const getFamilyActionErrorMessage = (error: any, fallback: string) => {
  const rawMessage = error instanceof Error ? error.message : "";
  const normalized = rawMessage.toLowerCase();
  if (normalized.includes("permission-denied") || normalized.includes("insufficient permissions")) {
    return "Permission denied. Please check your family status.";
  }
  return rawMessage.trim() || fallback;
};

const ProfileScreen = ({ navigation }: ProfileStackScreenProps<"Profile">) => {
  const { user, setUser } = useAuthStore();
  const { toInitials } = useTextFormatter();
  const [leavingFamily, setLeavingFamily] = useState(false);
  const [confirmLeaveModal, setConfirmLeaveModal] = useState(false);
  const [statusModal, setStatusModal] = useState<any>({
    visible: false,
    title: "",
    message: "",
    type: "error",
  });

  const handleLeaveFamilyRequest = () => {
    if (!user?.uid || !user.familyId || leavingFamily) return;
    setConfirmLeaveModal(true);
  };

  const executeLeaveFamily = async () => {
    if (!user?.uid || !user.familyId) return;
    setConfirmLeaveModal(false);
    try {
      setLeavingFamily(true);
      await leaveFamily({
        userId: user.uid,
        familyId: user.familyId,
        role: user.role,
      });
      setUser({ ...user, familyId: null, role: "member" });
      setStatusModal({
        visible: true,
        title: "Family Left",
        message: "You have successfully left the family group.",
        type: "success",
      });
    } catch (error) {
      const message = getFamilyActionErrorMessage(error, "Could not leave family.");
      setStatusModal({
        visible: true,
        title: "Action Failed",
        message: message,
        type: "error",
      });
    } finally {
      setLeavingFamily(false);
    }
  };

  const handleStatusModalClose = () => {
    const wasSuccess = statusModal.type === "success";
    setStatusModal((prev: any) => ({ ...prev, visible: false }));
    if (wasSuccess) {
      navigation.navigate(ETabRoutes.HOME);
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <View className="mb-3 mt-6 px-1">
      <Text className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary-500">
        {title}
      </Text>
    </View>
  );

  const MenuItem = ({
    icon: Icon,
    title,
    onPress,
    isDestructive = false,
    showChevron = true,
    rightElement,
    loading = false,
  }: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center py-4 px-5 border-b border-border last:border-b-0"
    >
      <View
        className={
          "mr-4 h-9 w-9 items-center justify-center rounded-md border border-border " +
          (isDestructive ? "bg-danger-light" : "bg-surface-alt")
        }
      >
        {loading ? (
          <ActivityIndicator size="small" color={isDestructive ? "#E55C5C" : "#10B981"} />
        ) : (
          <Icon stroke={isDestructive ? "#E55C5C" : "#4A5568"} size={18} strokeWidth={2.5} />
        )}
      </View>
      <Text
        className={
          "flex-1 text-[15px] font-bold " + (isDestructive ? "text-danger-dark" : "text-text-900")
        }
      >
        {title}
      </Text>
      {rightElement}
      {showChevron && !rightElement && (
        <ChevronRight stroke="#9AA3AF" size={18} strokeWidth={2.5} />
      )}
    </TouchableOpacity>
  );

  const confirmLeaveMessage =
    user?.role === "owner"
      ? "You are the owner. Ownership will be transferred to another member automatically. Continue?"
      : "Are you sure you want to leave this family group?";

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <AppHeader title="Profile" eyebrow="Settings" showNotification={false} />

      <StatusModal
        visible={confirmLeaveModal}
        title="Leave Family?"
        message={confirmLeaveMessage}
        type="confirm"
        confirmLabel="Leave Family"
        cancelLabel="Stay"
        onConfirm={executeLeaveFamily}
        onClose={() => setConfirmLeaveModal(false)}
      />

      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={handleStatusModalClose}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
      >
        <View className="px-6 pt-4">
          <Card className="mb-6 p-5 border-primary-100 bg-primary-50/30">
            <View className="flex-row items-center">
              <View className="mr-4 h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white border border-border shadow-xs">
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} className="h-full w-full" />
                ) : (
                  <Text className="text-[24px] font-bold text-primary-600">
                    {toInitials(user?.displayName)}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-[20px] font-bold tracking-tight text-text-900">
                  {user?.displayName || "User"}
                </Text>
                <Text className="text-[13px] font-medium text-text-muted mt-0.5">
                  {user?.email || "No email"}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate(ERootRoutes.EDIT_PROFILE)}
                className="h-10 w-10 items-center justify-center rounded-full bg-white border border-border"
              >
                <Edit3 stroke="#4A5568" size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </Card>

          <SectionHeader title="Preferences" />
          <Card padding={false} className="mb-2">
            <MenuItem
              icon={Shield}
              title="Privacy & Security"
              onPress={() => navigation.navigate(ERootRoutes.PRIVACY_SECURITY)}
            />
            <MenuItem
              icon={HelpCircle}
              title="Help & Support"
              onPress={() => navigation.navigate(ERootRoutes.HELP_SUPPORT)}
            />
          </Card>

          {user?.familyId && (
            <>
              <SectionHeader title="Family" />
              <Card padding={false} className="mb-2">
                <MenuItem
                  icon={Users}
                  title="Leave Family"
                  onPress={handleLeaveFamilyRequest}
                  isDestructive
                  loading={leavingFamily}
                />
              </Card>
            </>
          )}

          <SectionHeader title="Account" />
          <Card padding={false} className="mb-2">
            <MenuItem
              icon={LogOut}
              title="Logout"
              onPress={() => signOut()}
              isDestructive
              showChevron={false}
            />
          </Card>

          <View className="mt-12 items-center">
            <Text className="text-[11px] font-bold tracking-widest text-text-muted uppercase opacity-40">
              Family Grocery · v2.1.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
