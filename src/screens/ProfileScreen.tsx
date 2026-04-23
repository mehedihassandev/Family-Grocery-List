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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  LogOut,
  Shield,
  HelpCircle,
  ChevronRight,
  User as UserIcon,
  Edit3,
  Users,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { signOut } from "../services/auth";
import { leaveFamily } from "../services/family";
import { AppHeader, Card } from "../components/ui";

const getFamilyActionErrorMessage = (error: unknown, fallback: string) => {
  const rawMessage = error instanceof Error ? error.message : "";
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("permission-denied") || normalized.includes("insufficient permissions")) {
    return "Permission denied. Publish Firestore rules from FIRESTORE_RULES_SETUP.md";
  }

  if (rawMessage.trim()) {
    return rawMessage.trim();
  }

  return fallback;
};

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

const ProfileScreen = () => {
  const { user, setUser } = useAuthStore();
  const navigation = useNavigation<any>();
  const [leavingFamily, setLeavingFamily] = useState(false);

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
            navigation.navigate("Main");
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

  const menuItems = [
    {
      icon: Shield,
      title: "Privacy & Security",
      onPress: () => navigation.navigate("PrivacySecurity"),
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      onPress: () => navigation.navigate("HelpSupport"),
    },
  ];

  if (user?.familyId) {
    menuItems.push({
      icon: Users,
      title: "Leave Family",
      onPress: handleLeaveFamily,
    });
  }

  menuItems.push({
    icon: LogOut,
    title: "Logout",
    onPress: () => signOut(),
  });

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      <AppHeader title="Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className="px-5 pt-2">
          {/* Top Profile Card */}
          <View className="mb-6 flex-row items-center rounded-2xl bg-primary-50/80 p-5">
            <View className="mr-4 h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-surface shadow-sm">
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} className="h-full w-full" />
              ) : (
                <Text className="text-[22px] font-bold text-primary-700">
                  {getInitials(user?.displayName)}
                </Text>
              )}
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-[18px] font-bold text-text-primary">
                {user?.displayName || "User"}
              </Text>
              <View className="mt-1 flex-row items-center">
                <Text className="text-[13px] font-medium text-text-muted mr-3">
                  {user?.email || "No Email Associated"}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("EditProfile")}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  className="bg-primary-100 rounded-full p-1.5"
                >
                  <Edit3 stroke="#59AC77" size={12} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Unified Settings List Card */}
          <Card className="py-2">
            {menuItems.map((item, index) => {
              const isLast = index === menuItems.length - 1;
              const isLeaveFamily = item.title === "Leave Family";
              const isDestructive = isLeaveFamily || item.title === "Logout";
              const tintColor = isDestructive ? "#ef4444" : "#59AC77";
              const bgColor = isDestructive ? "bg-urgent/10" : "bg-primary-50";

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.6}
                  onPress={item.onPress}
                  disabled={isLeaveFamily && leavingFamily}
                  className={`mx-5 flex-row items-center py-3.5 ${
                    !isLast ? "border-b border-border-muted/60" : ""
                  }`}
                >
                  <View
                    className={`mr-4 items-center justify-center h-9 w-9 rounded-xl ${bgColor}`}
                  >
                    {isLeaveFamily && leavingFamily ? (
                      <ActivityIndicator color={tintColor} size="small" />
                    ) : (
                      <item.icon stroke={tintColor} size={18} strokeWidth={2.2} />
                    )}
                  </View>
                  <Text
                    className={`flex-1 text-[15px] font-medium ${isDestructive ? "text-urgent" : "text-text-primary"}`}
                  >
                    {item.title}
                  </Text>
                  <ChevronRight stroke="#95a39a" size={18} strokeWidth={2} />
                </TouchableOpacity>
              );
            })}
          </Card>

          {/* Version Text */}
          <View className="mt-8 items-center">
            <Text className="text-[11px] font-medium tracking-wide text-text-muted/60">
              Version 1.02
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
