import React, { useState } from "react";
import { ProfileStackScreenProps, ROUTES } from "../types";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { LogOut, Shield, HelpCircle, ChevronRight, Edit3, Users } from "lucide-react-native";

import { useAuthStore } from "../store/useAuthStore";
import { signOut } from "../services/auth";
import { leaveFamily } from "../services/family";
import { useTextFormatter } from "../hooks";
import { AppHeader, StatusModal } from "../components/ui";

type TStatusModalType = "success" | "error" | "warning" | "confirm";

interface IStatusModalState {
  visible: boolean;
  title: string;
  message: string;
  type: TStatusModalType;
}

interface IMenuItemProps {
  icon: React.ComponentType<{ stroke?: string; size?: number; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
  iconBgColor?: string;
  iconColor?: string;
  loading?: boolean;
}

const getFamilyActionErrorMessage = (error: unknown, fallback: string) => {
  const rawMessage = error instanceof Error ? error.message : "";
  const normalized = rawMessage.toLowerCase();
  if (normalized.includes("permission-denied") || normalized.includes("insufficient permissions")) {
    return "Permission denied. Please check your family status.";
  }
  return rawMessage.trim() || fallback;
};

/**
 * Declutter-focused Profile & Settings Screen
 * Why: Centered hero layout, spacious pastel menu rows, zero clutter.
 */
const ProfileScreen = ({ navigation }: ProfileStackScreenProps) => {
  const { user, setUser } = useAuthStore();
  const { toInitials } = useTextFormatter();
  const [leavingFamily, setLeavingFamily] = useState(false);
  const [confirmLeaveModal, setConfirmLeaveModal] = useState(false);
  const [statusModal, setStatusModal] = useState<IStatusModalState>({
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
    setStatusModal((prev) => ({ ...prev, visible: false }));
    if (wasSuccess) {
      (navigation as any)?.navigate?.("Dashboard");
    }
  };

  const MenuItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    isDestructive = false,
    showChevron = true,
    iconBgColor = "bg-slate-50",
    iconColor = "#475569",
    loading = false,
  }: IMenuItemProps) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center py-4 border-b border-slate-100"
    >
      <View
        className={`mr-4 h-10 w-10 items-center justify-center rounded-full ${
          isDestructive ? "bg-rose-50" : iconBgColor
        }`}
      >
        {loading ? (
          <ActivityIndicator size="small" color={isDestructive ? "#EF4444" : iconColor} />
        ) : (
          <Icon stroke={isDestructive ? "#EF4444" : iconColor} size={18} strokeWidth={2} />
        )}
      </View>
      <View className="flex-1">
        <Text
          className={`text-[15px] font-extrabold ${
            isDestructive ? "text-rose-600" : "text-slate-900"
          }`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-[11px] font-medium text-slate-400 mt-0.5">{subtitle}</Text>
        ) : null}
      </View>
      {showChevron && <ChevronRight stroke="#CBD5E1" size={18} strokeWidth={2} />}
    </TouchableOpacity>
  );

  const confirmLeaveMessage =
    user?.role === "owner"
      ? "You are the owner. Ownership will be transferred to another member automatically. Continue?"
      : "Are you sure you want to leave this family group?";

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
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
        className="flex-1 bg-white px-6"
      >
        {/* Spacious Centered User Profile Hero */}
        <Animated.View
          entering={FadeInDown.duration(350).springify()}
          className="py-8 items-center border-b border-slate-100 mb-2"
        >
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-emerald-50 border-2 border-emerald-100 mb-3 shadow-xs">
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-[26px] font-black text-emerald-700">
                {toInitials(user?.displayName)}
              </Text>
            )}
          </View>
          <Text className="text-[22px] font-black text-slate-900 tracking-tight">
            {user?.displayName || "User"}
          </Text>
          <Text className="text-[13px] font-medium text-slate-400 mt-0.5 mb-4">
            {user?.email || "No email"}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)}
            className="flex-row items-center bg-slate-100 px-4 py-2 rounded-full"
          >
            <Edit3 stroke="#475569" size={14} strokeWidth={2} className="mr-1.5" />
            <Text className="text-[13px] font-bold text-slate-700">Edit Profile</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Streamlined Menu Sections */}
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          {/* General Section */}
          <View className="mt-4 mb-1">
            <Text className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 mb-1">
              General
            </Text>
            <MenuItem
              icon={Shield}
              title="Privacy & Security"
              subtitle="Data protection and access rules"
              onPress={() => navigation.navigate(ROUTES.PRIVACY_SECURITY)}
              iconBgColor="bg-emerald-50"
              iconColor="#059669"
            />
            <MenuItem
              icon={HelpCircle}
              title="Help & Support"
              subtitle="FAQ, guides, and bug reporting"
              onPress={() => navigation.navigate(ROUTES.HELP_SUPPORT)}
              iconBgColor="bg-blue-50"
              iconColor="#2563EB"
            />
          </View>

          {/* Account & Group Section */}
          <View className="mt-6 mb-1">
            <Text className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Account & Group
            </Text>
            {user?.familyId ? (
              <MenuItem
                icon={Users}
                title="Leave Family Group"
                subtitle="Exit your current shared list"
                onPress={handleLeaveFamilyRequest}
                isDestructive
                loading={leavingFamily}
                iconBgColor="bg-rose-50"
                iconColor="#EF4444"
              />
            ) : null}

            <MenuItem
              icon={LogOut}
              title="Log Out"
              onPress={() => signOut()}
              isDestructive
              showChevron={false}
              iconBgColor="bg-rose-50"
              iconColor="#EF4444"
            />
          </View>

          <View className="mt-12 items-center">
            <Text className="text-[10px] font-bold tracking-widest text-slate-300 uppercase">
              Family Grocery · v2.1.0
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
