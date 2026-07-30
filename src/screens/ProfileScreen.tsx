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
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  LogOut,
  Shield,
  HelpCircle,
  ChevronRight,
  Edit3,
  Users,
  Sun,
  Moon,
  Monitor,
} from "lucide-react-native";

import { useAuthStore } from "../store/useAuthStore";
import { signOut } from "../services/auth";
import { leaveFamily } from "../services/family";
import { useTextFormatter, useAppTheme } from "../hooks";
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
  bgColor?: string;
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
  const { isDark, colors, themeMode, setThemeMode } = useAppTheme();
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
    showChevron = true,
    isDestructive = false,
    bgColor,
    iconColor = colors.icon,
    loading = false,
  }: IMenuItemProps) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center py-4"
    >
      <View
        className="mr-4 h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: isDestructive ? colors.badgeRoseBg : bgColor || colors.bgInput }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={isDestructive ? colors.danger : iconColor} />
        ) : (
          <Icon stroke={isDestructive ? colors.danger : iconColor} size={18} strokeWidth={2} />
        )}
      </View>
      <View className="flex-1">
        <Text
          className="text-[15px] font-extrabold"
          style={{ color: isDestructive ? colors.danger : colors.textPrimary }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-[11px] font-medium mt-0.5" style={{ color: colors.textMuted }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron && <ChevronRight stroke={colors.icon} size={18} strokeWidth={2} />}
    </TouchableOpacity>
  );

  const confirmLeaveMessage =
    user?.role === "owner"
      ? "You are the owner. Ownership will be transferred to another member automatically. Continue?"
      : "Are you sure you want to leave this family group?";

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: colors.bgCanvas }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
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
        className="flex-1 px-6"
        style={{ backgroundColor: colors.bgCanvas }}
      >
        {/* Spacious Centered User Profile Hero */}
        <Animated.View
          entering={FadeInDown.duration(350).springify()}
          className="py-8 items-center mb-2"
        >
          <View
            className="h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 mb-3 shadow-xs"
            style={{ backgroundColor: colors.accentMuted, borderColor: colors.border }}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-[26px] font-black" style={{ color: colors.accent }}>
                {toInitials(user?.displayName)}
              </Text>
            )}
          </View>
          <Text
            className="text-[22px] font-black tracking-tight"
            style={{ color: colors.textPrimary }}
          >
            {user?.displayName || "Family Member"}
          </Text>
          <Text
            className="text-[13px] font-medium mt-0.5 mb-4"
            style={{ color: colors.textSecondary }}
          >
            {user?.email}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)}
            className="flex-row items-center px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.bgInput }}
          >
            <Edit3 stroke={colors.icon} size={14} strokeWidth={2} className="mr-1.5" />
            <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Streamlined Menu Sections */}
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          {/* Appearance Section */}
          <View className="mt-4 mb-4">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-2"
              style={{ color: colors.accent }}
            >
              Appearance
            </Text>
            <View
              className="flex-row items-center justify-between p-1.5 rounded-xl border"
              style={{ backgroundColor: colors.bgInput, borderColor: colors.border }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setThemeMode("light")}
                accessibilityRole="button"
                accessibilityLabel="Switch to Light Theme"
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                style={[
                  themeMode === "light" ? { backgroundColor: colors.bgCard } : undefined,
                  themeMode === "light" ? shadowStyles.xs : undefined,
                ]}
              >
                <Sun
                  stroke={themeMode === "light" ? colors.accent : colors.icon}
                  size={16}
                  strokeWidth={2}
                />
                <Text
                  className="ml-2 text-[12px] font-bold"
                  style={{ color: themeMode === "light" ? colors.accent : colors.textMuted }}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setThemeMode("dark")}
                accessibilityRole="button"
                accessibilityLabel="Switch to Dark Theme"
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                style={[
                  themeMode === "dark" ? { backgroundColor: colors.accent } : undefined,
                  themeMode === "dark" ? shadowStyles.xs : undefined,
                ]}
              >
                <Moon
                  stroke={themeMode === "dark" ? colors.white : colors.icon}
                  size={16}
                  strokeWidth={2}
                />
                <Text
                  className="ml-2 text-[12px] font-bold"
                  style={{ color: themeMode === "dark" ? colors.white : colors.textMuted }}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setThemeMode("system")}
                accessibilityRole="button"
                accessibilityLabel="Use System Theme Preference"
                className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl"
                style={[
                  themeMode === "system" ? { backgroundColor: colors.bgCard } : undefined,
                  themeMode === "system" ? shadowStyles.xs : undefined,
                ]}
              >
                <Monitor
                  stroke={themeMode === "system" ? colors.accent : colors.icon}
                  size={16}
                  strokeWidth={2}
                />
                <Text
                  className="ml-2 text-[12px] font-bold"
                  style={{ color: themeMode === "system" ? colors.accent : colors.textMuted }}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* General Section */}
          <View className="mt-2 mb-1">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-1"
              style={{ color: colors.textMuted }}
            >
              General
            </Text>
            <MenuItem
              icon={Shield}
              title="Privacy & Security"
              subtitle="Data protection and access rules"
              onPress={() => navigation.navigate(ROUTES.PRIVACY_SECURITY)}
              bgColor={colors.accentMuted}
              iconColor={colors.accent}
            />
            <MenuItem
              icon={HelpCircle}
              title="Help & Support"
              subtitle="FAQ, guides, and bug reporting"
              onPress={() => navigation.navigate(ROUTES.HELP_SUPPORT)}
              bgColor={colors.infoLight}
              iconColor={colors.info}
            />
          </View>

          {/* Account & Group Section */}
          <View className="mt-6 mb-1">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-1"
              style={{ color: colors.textMuted }}
            >
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
                iconColor={colors.danger}
              />
            ) : null}

            <MenuItem
              icon={LogOut}
              title="Log Out"
              onPress={() => signOut()}
              isDestructive
              showChevron={false}
              iconBgColor="bg-rose-50"
              iconColor={colors.danger}
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

/**
 * Why inline styles instead of NativeWind `shadow-xs`:
 * NativeWind v4 CSS interop breaks React's Context tree when shadow classes
 * are conditionally toggled, causing React Navigation to lose NavigationStateContext.
 */
const shadowStyles = StyleSheet.create({
  xs: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
});

export default ProfileScreen;
