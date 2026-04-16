import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
} from "react-native";
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
            color: "bg-emerald-50 text-emerald-600",
        },
        {
            icon: Shield,
            title: "Privacy & Security",
            color: "bg-emerald-50 text-emerald-600",
        },
        {
            icon: HelpCircle,
            title: "Help & Support",
            color: "bg-emerald-50 text-emerald-600",
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-[#fcfdfd]">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 150 }}
            >
                {/* Profile Header */}
                <View className="bg-white px-8 pt-16 pb-12 items-center rounded-b-[60px] shadow-sm shadow-gray-100">
                    <View className="w-32 h-32 bg-emerald-50 rounded-full items-center justify-center mb-6 overflow-hidden border-4 border-white shadow-lg shadow-emerald-100/50">
                        {user?.photoURL ? (
                            <Image
                                source={{ uri: user.photoURL }}
                                className="w-full h-full"
                            />
                        ) : (
                            <UserIcon
                                stroke="#10b981"
                                size={50}
                                strokeWidth={1.5}
                            />
                        )}
                    </View>
                    <Text className="text-3xl font-black text-gray-900 mb-1 tracking-tight">
                        {user?.displayName}
                    </Text>
                    <Text className="text-gray-400 font-bold mb-8 tracking-wide text-xs uppercase">
                        {user?.email}
                    </Text>

                    <TouchableOpacity className="bg-emerald-500 px-8 py-3 rounded-2xl shadow-md shadow-emerald-200">
                        <Text className="text-white font-black text-sm uppercase tracking-widest">
                            Edit Profile
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Settings Menu */}
                <View className="p-8">
                    <Text className="text-emerald-600 font-black uppercase tracking-[2px] text-[10px] mb-6 ml-1">
                        Preferences
                    </Text>
                    <View className="bg-white rounded-[40px] p-3 border border-gray-100/50 mb-10 shadow-sm shadow-gray-200/50">
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.6}
                                className={`flex-row items-center p-5 ${index !== menuItems.length - 1 ? "border-b border-gray-50" : ""}`}
                            >
                                <View
                                    className={`p-3 rounded-2xl mr-5 ${item.color.split(" ")[0]}`}
                                >
                                    <item.icon
                                        stroke={item.color
                                            .split(" ")[1]
                                            .replace("text-", "")}
                                        size={22}
                                        strokeWidth={2}
                                    />
                                </View>
                                <Text className="flex-1 text-gray-800 font-bold text-base tracking-tight">
                                    {item.title}
                                </Text>
                                <ChevronRight
                                    stroke="#d1d5db"
                                    size={20}
                                    strokeWidth={2.5}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => signOut()}
                        activeOpacity={0.8}
                        className="bg-red-50 flex-row items-center p-6 rounded-[40px] border border-red-100/50 shadow-sm shadow-red-100"
                    >
                        <View className="bg-red-100 p-3 rounded-2xl mr-5">
                            <LogOut
                                stroke="#ef4444"
                                size={22}
                                strokeWidth={2.5}
                            />
                        </View>
                        <Text className="flex-1 text-red-600 font-bold text-lg tracking-tight">
                            Sign Out
                        </Text>
                        <ChevronRight
                            stroke="#fca5a5"
                            size={20}
                            strokeWidth={2.5}
                        />
                    </TouchableOpacity>

                    <View className="mt-16 items-center">
                        <Text className="text-gray-300 text-[10px] font-black uppercase tracking-[3px]">
                            Family Grocery v1.0.0
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;
