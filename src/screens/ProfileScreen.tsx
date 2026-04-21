import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  LogOut,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  User as UserIcon,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { signOut } from "../services/auth";

const ProfileScreen = () => {
  const { user } = useAuthStore();

  const menuItems = [
    {
      icon: Bell,
      title: "Notifications",
      iconBg: "bg-primary-50",
      iconColor: "#59AC77",
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      iconBg: "bg-primary-50",
      iconColor: "#59AC77",
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      iconBg: "bg-primary-50",
      iconColor: "#59AC77",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        {/* Profile Header */}
        <View className="bg-surface px-8 pt-16 pb-12 items-center rounded-b-[60px] shadow-sm shadow-secondary-100/40">
          <View className="w-32 h-32 bg-primary-50 rounded-full items-center justify-center mb-6 overflow-hidden border-4 border-surface shadow-lg shadow-primary-200/50">
            {user?.photoURL ? (
              <Image
                source={{ uri: user.photoURL }}
                className="w-full h-full"
              />
            ) : (
              <UserIcon stroke="#59AC77" size={50} strokeWidth={1.5} />
            )}
          </View>
          <Text className="text-3xl font-black text-text-primary mb-1 tracking-tight">
            {user?.displayName}
          </Text>
          <Text className="text-text-muted font-bold mb-8 tracking-wide text-xs uppercase">
            {user?.email}
          </Text>

          <TouchableOpacity className="bg-primary-600 px-8 py-3 rounded-2xl shadow-md shadow-primary-200">
            <Text className="text-text-inverse font-black text-sm uppercase tracking-widest">
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings Menu */}
        <View className="p-8">
          <Text className="text-primary-600 font-black uppercase tracking-[2px] text-[10px] mb-6 ml-1">
            Preferences
          </Text>
          <View className="bg-surface rounded-[40px] p-3 border border-border-muted mb-10 shadow-sm shadow-secondary-100/30">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.6}
                className={`flex-row items-center p-5 ${index !== menuItems.length - 1 ? "border-b border-border-muted/70" : ""}`}
              >
                <View className={`p-3 rounded-2xl mr-5 ${item.iconBg}`}>
                  <item.icon
                    stroke={item.iconColor}
                    size={22}
                    strokeWidth={2}
                  />
                </View>
                <Text className="flex-1 text-text-primary font-bold text-base tracking-tight">
                  {item.title}
                </Text>
                <ChevronRight stroke="#95a39a" size={20} strokeWidth={2.5} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => signOut()}
            activeOpacity={0.8}
            className="bg-urgent/10 flex-row items-center p-6 rounded-[40px] border border-urgent/25 shadow-sm shadow-urgent/10"
          >
            <View className="bg-urgent/20 p-3 rounded-2xl mr-5">
              <LogOut stroke="#c36262" size={22} strokeWidth={2.5} />
            </View>
            <Text className="flex-1 text-urgent font-bold text-lg tracking-tight">
              Sign Out
            </Text>
            <ChevronRight stroke="#c36262" size={20} strokeWidth={2.5} />
          </TouchableOpacity>

          <View className="mt-16 items-center">
            <Text className="text-text-subtle text-[10px] font-black uppercase tracking-[3px]">
              Family Grocery v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
