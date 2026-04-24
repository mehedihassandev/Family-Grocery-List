import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import {
  LogOut,
  Shield,
  HelpCircle,
  ChevronRight,
  User as UserIcon,
  Edit3,
  Users,
  Moon,
  Sun,
  Monitor,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { signOut } from "../services/auth";
import { leaveFamily } from "../services/family";
import { AppHeader, Card, Chip } from "../components/ui";

const getFamilyActionErrorMessage = (error: unknown, fallback: string) => {
  const rawMessage = error instanceof Error ? error.message : "";
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("permission-denied") || normalized.includes("insufficient permissions")) {
    return "Permission denied. Publish Firestore rules from FIRESTORE_RULES_SETUP.md";
  }

  return rawMessage.trim() || fallback;
};

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

/**
 * User profile and settings screen
 * Why: To manage account details, app preferences (like dark mode), and family membership.
 */
const ProfileScreen = ({ navigation }: any) => {
  const { user, setUser } = useAuthStore();
  const { theme } = useThemeStore();
  const [leavingFamily, setLeavingFamily] = useState(false);

  const isDark = false;

  const handleLeaveFamily = () => {
    if (!user?.uid || !user.familyId || leavingFamily) return;

    const isOwner = user.role === "owner";
    const confirmMessage = isOwner
      ? "You are owner. If other members exist, ownership will transfer automatically. Continue?"
      : "Do you want to leave this family?";

    Alert.alert("Leave Family", confirmMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            setLeavingFamily(true);
            await leaveFamily({
              userId: user.uid,
              familyId: user.familyId!,
              role: user.role,
            });
            setUser({ ...user, familyId: null, role: "member" });
            navigation.navigate("Dashboard");
          } catch (error) {
            const message = getFamilyActionErrorMessage(error, "Could not leave family.");
            Alert.alert("Leave Failed", message);
          } finally {
            setLeavingFamily(false);
          }
        },
      },
    ]);
  };


  const SectionHeader = ({ title }: { title: string }) => (
    <View className="mb-3 mt-6 px-1">
      <Text className="text-[11px] font-bold uppercase tracking-[2px] text-text-muted dark:text-text-dark-muted">
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
    loading = false
  }: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center py-4 px-5 border-b border-border-muted/40 dark:border-border-dark/40 last:border-b-0"
    >
      <View className={`mr-4 h-9 w-9 items-center justify-center rounded-xl ${
        isDestructive 
          ? "bg-red-50 dark:bg-red-900/10" 
          : "bg-primary-50 dark:bg-primary-900/10"
      }`}>
        {loading ? (
          <ActivityIndicator size="small" color={isDestructive ? "#ef4444" : "#59AC77"} />
        ) : (
          <Icon 
            stroke={isDestructive ? "#ef4444" : "#59AC77"} 
            size={18} 
            strokeWidth={2.5} 
          />
        )}
      </View>
      <Text className={`flex-1 text-[15px] font-bold ${
        isDestructive ? "text-red-600 dark:text-red-400" : "text-text-primary dark:text-text-dark-primary"
      }`}>
        {title}
      </Text>
      {rightElement}
      {showChevron && !rightElement && (
        <ChevronRight stroke={isDark ? "#4f5f56" : "#95a39a"} size={18} strokeWidth={2.5} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background dark:bg-background-dark">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <AppHeader title="Profile" eyebrow="Settings" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
      >
        <View className="px-6 pt-4">
          {/* User Profile Header */}
          <Card className="mb-6 p-5 border-primary-100 dark:border-primary-900/30 bg-primary-50/20 dark:bg-primary-900/10">
            <View className="flex-row items-center">
              <View className="mr-4 h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-surface dark:bg-surface-dark border border-border-muted dark:border-border-dark shadow-sm">
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} className="h-full w-full" />
                ) : (
                  <Text className="text-[24px] font-black text-primary-600 dark:text-primary-400">
                    {getInitials(user?.displayName)}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-[20px] font-black tracking-tight text-text-primary dark:text-text-dark-primary">
                  {user?.displayName || "User"}
                </Text>
                <Text className="text-[13px] font-medium text-text-muted dark:text-text-dark-muted mt-0.5">
                  {user?.email || "No email"}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("EditProfile")}
                className="h-10 w-10 items-center justify-center rounded-xl bg-surface dark:bg-surface-dark border border-border-muted dark:border-border-dark"
              >
                <Edit3 stroke={isDark ? "#cbd5cf" : "#748379"} size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Preferences Section */}
          <SectionHeader title="Preferences" />
          <Card padding={false} className="mb-2">
            <MenuItem 
              icon={Shield} 
              title="Privacy & Security" 
              onPress={() => navigation.navigate("PrivacySecurity")} 
            />
            <MenuItem 
              icon={HelpCircle} 
              title="Help & Support" 
              onPress={() => navigation.navigate("HelpSupport")} 
            />
          </Card>

          {/* Family Section */}
          {user?.familyId && (
            <>
              <SectionHeader title="Family" />
              <Card padding={false} className="mb-2">
                <MenuItem 
                  icon={Users} 
                  title="Leave Family" 
                  onPress={handleLeaveFamily}
                  isDestructive
                  loading={leavingFamily}
                />
              </Card>
            </>
          )}

          {/* Account Section */}
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

          {/* Version Text */}
          <View className="mt-12 items-center">
            <Text className="text-[11px] font-bold tracking-widest text-text-muted dark:text-text-dark-muted uppercase opacity-40">
              Family Grocery · v1.2.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
