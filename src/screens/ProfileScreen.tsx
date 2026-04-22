import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    StatusBar,
    Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    LogOut,
    Bell,
    Shield,
    HelpCircle,
    ChevronRight,
    User as UserIcon,
    UserCircle2,
    Share2,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { signOut } from "../services/auth";
import { getFamilyDetails } from "../services/family";
import { Family } from "../types";

const ProfileScreen = () => {
    const { user } = useAuthStore();
    const [family, setFamily] = useState<Family | null>(null);

    useEffect(() => {
        if (!user?.familyId) return;

        getFamilyDetails(user.familyId)
            .then(setFamily)
            .catch((error) => {
                console.error("Get Family Details Error:", error);
            });
    }, [user?.familyId]);

    const handleShareInvite = async () => {
        if (!family) return;
        try {
            await Share.share({
                message: `Join our family grocery list! Use invite code: ${family.inviteCode}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

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
        <SafeAreaView
            edges={["top", "left", "right"]}
            className="flex-1 bg-background"
        >
            <StatusBar barStyle="dark-content" />
            <View
                className="absolute -left-24 -top-20 h-56 w-56 rounded-full bg-primary-100"
                style={{ opacity: 0.45 }}
            />
            <View
                className="absolute -right-24 top-44 h-52 w-52 rounded-full bg-secondary-100"
                style={{ opacity: 0.55 }}
            />
            <View className="px-6 pt-4">
                <View
                    className="relative mb-6 flex-row items-start justify-between overflow-hidden rounded-3xl border border-border-muted/80 px-5 py-4"
                    style={{
                        backgroundColor: "rgba(255,255,255,0.72)",
                        shadowColor: "#4f5f56",
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.08,
                        shadowRadius: 14,
                        elevation: 3,
                    }}
                >
                    <View
                        pointerEvents="none"
                        className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/45"
                    />
                    <View
                        pointerEvents="none"
                        className="absolute -left-10 bottom-0 h-20 w-48 rounded-full bg-white/25"
                    />
                    <View
                        pointerEvents="none"
                        className="absolute left-0 right-0 top-0 h-10 bg-white/30"
                    />
                    <View className="flex-1 pr-4">
                        <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-primary-700">
                            Account
                        </Text>
                        <Text className="mt-1 text-[35px] font-black tracking-tight text-text-primary">
                            Profile
                        </Text>
                        <Text className="mt-1 text-[15px] leading-6 text-text-secondary">
                            Manage your family account
                        </Text>
                    </View>
                    <View className="items-center">
                        <View className="h-11 w-11 items-center justify-center rounded-full border border-border-muted bg-surface/95">
                            <UserCircle2
                                stroke="#59AC77"
                                size={19}
                                strokeWidth={2.3}
                            />
                        </View>
                        <Text className="mt-1 text-[11px] font-medium text-text-muted">
                            You
                        </Text>
                    </View>
                </View>
            </View>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 150, paddingTop: 2 }}
            >
                <View
                    className="mx-6 rounded-3xl border border-border-muted/80 px-6 pb-7 pt-7"
                    style={{
                        backgroundColor: "rgba(255,255,255,0.62)",
                        shadowColor: "#4f5f56",
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.06,
                        shadowRadius: 14,
                        elevation: 2,
                    }}
                >
                    <View className="mb-5 flex-row items-center">
                        <View className="mr-4 h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border-muted bg-primary-50">
                            {user?.photoURL ? (
                                <Image
                                    source={{ uri: user.photoURL }}
                                    className="h-full w-full"
                                />
                            ) : (
                                <UserIcon
                                    stroke="#59AC77"
                                    size={30}
                                    strokeWidth={1.8}
                                />
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-[24px] font-black tracking-tight text-text-primary">
                                {user?.displayName}
                            </Text>
                            <Text className="mt-1 text-[14px] text-text-muted">
                                {user?.email}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        className="items-center justify-center rounded-2xl bg-primary-600 py-3.5"
                    >
                        <Text className="text-[14px] font-semibold tracking-wide text-text-inverse">
                            Edit Profile
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="px-6 pt-7">
                    <Text className="mb-4 text-[12px] font-semibold uppercase tracking-[1.3px] text-text-muted">
                        Preferences
                    </Text>
                    <View
                        className="mb-8 rounded-3xl border border-border-muted/80 p-2"
                        style={{ backgroundColor: "rgba(255,255,255,0.58)" }}
                    >
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.6}
                                className={`flex-row items-center px-3 py-4 ${index !== menuItems.length - 1 ? "border-b border-border-muted/70" : ""}`}
                            >
                                <View
                                    className={`mr-4 rounded-xl p-2.5 ${item.iconBg}`}
                                >
                                    <item.icon
                                        stroke={item.iconColor}
                                        size={18}
                                        strokeWidth={2}
                                    />
                                </View>
                                <Text className="flex-1 text-[16px] font-semibold tracking-tight text-text-primary">
                                    {item.title}
                                </Text>
                                <ChevronRight
                                    stroke="#95a39a"
                                    size={18}
                                    strokeWidth={2.5}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={() => signOut()}
                        activeOpacity={0.8}
                        className="flex-row items-center rounded-2xl border border-urgent/30 bg-urgent/10 px-4 py-4"
                    >
                        <View className="mr-4 rounded-xl bg-urgent/20 p-2.5">
                            <LogOut
                                stroke="#c36262"
                                size={20}
                                strokeWidth={2.5}
                            />
                        </View>
                        <Text className="flex-1 text-[16px] font-semibold tracking-tight text-urgent">
                            Sign Out
                        </Text>
                        <ChevronRight
                            stroke="#c36262"
                            size={18}
                            strokeWidth={2.5}
                        />
                    </TouchableOpacity>

                    <View className="mt-12 items-center">
                        <Text className="text-[10px] font-black uppercase tracking-[3px] text-text-subtle">
                            Family Grocery v1.0.0
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;
