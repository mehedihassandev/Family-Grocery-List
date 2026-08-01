import React, { useState } from "react";
import { ProfileStackScreenProps, ROUTES } from "../types";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Switch,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  LogOut,
  Shield,
  HelpCircle,
  ChevronRight,
  Pencil,
  Users,
  Bell,
  ArrowRight,
} from "lucide-react-native";

import { useAuthStore } from "../store/useAuthStore";
import { signOut } from "../services/auth";
import { useTextFormatter, useAppTheme, useFamilyMembers } from "../hooks";
import { AppHeader } from "../components/ui";

/**
 * Profile Screen matching Screenshot 2 mockup design
 */
const ProfileScreen = ({ navigation }: ProfileStackScreenProps) => {
  const { user } = useAuthStore();
  const { toInitials } = useTextFormatter();
  const { isDark, colors, themeMode, setThemeMode } = useAppTheme();
  const { data: members = [] } = useFamilyMembers(user?.familyId);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? colors.bgCanvas : "#F4F5FB" }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <AppHeader
        eyebrow="GOOD MORNING"
        title="Profile"
        onNotificationPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
        onProfilePress={() => navigation.navigate(ROUTES.PROFILE)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="flex-1 px-5 pt-4"
      >
        {/* Centered User Hero Section */}
        <Animated.View
          entering={FadeInDown.duration(350).springify()}
          className="items-center mb-5"
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)}
            className="relative"
          >
            <View
              className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-2xs"
              style={{ backgroundColor: isDark ? colors.bgSurface : "#FFFFFF" }}
            >
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} className="h-full w-full" />
              ) : (
                <Text className="text-[28px] font-black text-emerald-700">
                  {toInitials(user?.displayName)}
                </Text>
              )}
            </View>
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-emerald-600 border-2 border-white shadow-xs">
              <Pencil stroke="white" size={14} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          <Text
            className="text-[22px] font-black tracking-tight mt-3"
            style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
          >
            {user?.displayName || "Md Mehedi Hassan"}
          </Text>
          <Text
            className="text-[13px] font-medium mt-0.5"
            style={{ color: isDark ? colors.textSecondary : "#64748B" }}
          >
            {user?.email || "mehedi@example.com"}
          </Text>
        </Animated.View>

        {/* Card 1: Appearance */}
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="rounded-2xl p-4 mb-4 border shadow-xs"
          style={{ backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }}
        >
          <Text
            className="text-[12px] font-extrabold uppercase tracking-wider mb-2.5 ml-1"
            style={{ color: colors.accent }}
          >
            Appearance
          </Text>

          <View
            className="flex-row items-center justify-between p-1 rounded-xl border"
            style={{ backgroundColor: colors.bgInput, borderColor: colors.borderSubtle }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setThemeMode("light")}
              className="flex-1 items-center justify-center py-2.5 rounded-lg"
              style={[
                themeMode === "light" ? { backgroundColor: colors.bgSurface } : undefined,
                themeMode === "light" ? shadowStyles.xs : undefined,
              ]}
            >
              <Text
                className="text-[13px] font-extrabold"
                style={{ color: themeMode === "light" ? colors.textPrimary : colors.textMuted }}
              >
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setThemeMode("dark")}
              className="flex-1 items-center justify-center py-2.5 rounded-lg"
              style={[
                themeMode === "dark" ? { backgroundColor: colors.accent } : undefined,
                themeMode === "dark" ? shadowStyles.xs : undefined,
              ]}
            >
              <Text
                className="text-[13px] font-extrabold"
                style={{ color: themeMode === "dark" ? "#FFFFFF" : colors.textMuted }}
              >
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setThemeMode("system")}
              className="flex-1 items-center justify-center py-2.5 rounded-lg"
              style={[
                themeMode === "system" ? { backgroundColor: colors.bgSurface } : undefined,
                themeMode === "system" ? shadowStyles.xs : undefined,
              ]}
            >
              <Text
                className="text-[13px] font-extrabold"
                style={{ color: themeMode === "system" ? colors.textPrimary : colors.textMuted }}
              >
                System
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Card 2: Settings List (Notifications, Privacy, Help) */}
        <Animated.View
          entering={FadeInDown.duration(450).springify()}
          className="rounded-2xl p-4 mb-4 border shadow-xs"
          style={{ backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }}
        >
          {/* Row 1: Notifications */}
          <View className="flex-row items-center py-2.5">
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl mr-3.5"
              style={{ backgroundColor: isDark ? colors.accentLightSubtle : "#D1FAE5" }}
            >
              <Bell stroke={colors.accent} size={18} strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text
                className="text-[15px] font-extrabold"
                style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
              >
                Notifications
              </Text>
              <Text
                className="text-[11px] font-medium mt-0.5"
                style={{ color: isDark ? colors.textSecondary : "#64748B" }}
              >
                Alerts for budget & list updates
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#CBD5E1", true: "#047857" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View
            className="h-[1px] my-2"
            style={{ backgroundColor: isDark ? colors.border : "rgba(226, 232, 240, 0.7)" }}
          />

          {/* Row 2: Privacy & Security */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate(ROUTES.PRIVACY_SECURITY)}
            className="flex-row items-center py-2.5"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl mr-3.5"
              style={{ backgroundColor: isDark ? colors.bgInput : "#DBEAFE" }}
            >
              <Shield stroke="#1D4ED8" size={18} strokeWidth={2.2} />
            </View>
            <Text
              className="flex-1 text-[15px] font-extrabold"
              style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
            >
              Privacy & Security
            </Text>
            <ChevronRight stroke={colors.iconMuted} size={18} strokeWidth={2} />
          </TouchableOpacity>

          <View
            className="h-[1px] my-2"
            style={{ backgroundColor: isDark ? colors.border : "rgba(226, 232, 240, 0.7)" }}
          />

          {/* Row 3: Help & Support */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate(ROUTES.HELP_SUPPORT)}
            className="flex-row items-center py-2.5"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-2xl mr-3.5"
              style={{ backgroundColor: isDark ? colors.bgInput : "#DBEAFE" }}
            >
              <HelpCircle stroke="#1D4ED8" size={18} strokeWidth={2.2} />
            </View>
            <Text
              className="flex-1 text-[15px] font-extrabold"
              style={{ color: isDark ? colors.textPrimary : "#0F172A" }}
            >
              Help & Support
            </Text>
            <ChevronRight stroke={colors.iconMuted} size={18} strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Card 3: Manage Family Group Green Banner */}
        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate(ROUTES.FAMILY)}
            className="rounded-full p-3.5 flex-row items-center justify-between mb-5"
            style={{ backgroundColor: "#047857" }}
          >
            <View className="flex-row items-center flex-1">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20 mr-3">
                <Users stroke="white" size={18} strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-extrabold text-white">Manage Family Group</Text>
                <Text className="text-[11px] font-medium text-emerald-100 mt-0.5">
                  {members.length > 0 ? `${members.length} members active` : "3 members active"}
                </Text>
              </View>
            </View>
            <View className="h-8 w-8 items-center justify-center rounded-full bg-white ml-2">
              <ArrowRight stroke="#047857" size={16} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInDown.duration(550).springify()} className="gap-3 mb-6">
          {/* Log Out Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => signOut()}
            className="h-12 rounded-full flex-row items-center justify-center px-4"
            style={{ backgroundColor: isDark ? colors.bgInput : "#E8EEFC" }}
          >
            <LogOut
              stroke={isDark ? colors.textPrimary : "#1E293B"}
              size={18}
              strokeWidth={2.2}
              style={{ marginRight: 8 }}
            />
            <Text
              className="font-extrabold text-[15px]"
              style={{ color: isDark ? colors.textPrimary : "#1E293B" }}
            >
              Log Out
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View className="items-center mb-8">
          <Text
            className="text-[11px] font-extrabold tracking-wide uppercase"
            style={{ color: colors.textMuted }}
          >
            App Version 2.1.0 (Build 492)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const shadowStyles = StyleSheet.create({
  xs: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

export default ProfileScreen;
