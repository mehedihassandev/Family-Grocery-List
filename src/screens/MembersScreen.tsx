import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    Share,
    ActivityIndicator,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Share2, Crown, User as UserIcon, Users } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { subscribeToFamilyMembers, getFamilyDetails } from "../services/family";
import { User, Family } from "../types";

const MembersScreen = () => {
    const { user } = useAuthStore();
    const [members, setMembers] = useState<User[]>([]);
    const [family, setFamily] = useState<Family | null>(null);
    const [loading, setLoading] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);
    const ownerCount = members.filter(
        (member) => member.role === "owner",
    ).length;
    const memberCount = members.filter(
        (member) => member.role !== "owner",
    ).length;
    const myRole =
        members.find((member) => member.uid === user?.uid)?.role ?? user?.role;

    useEffect(() => {
        if (!user?.familyId) return;

        // Fetch family details (invite code)
        getFamilyDetails(user.familyId)
            .then(setFamily)
            .catch((error) => {
                console.error("Get Family Details Error:", error);
            });

        // Subscribe to members
        const unsubscribe = subscribeToFamilyMembers(
            user.familyId,
            (newMembers) => {
                setMembers(newMembers);
                setMembersError(null);
                setLoading(false);
            },
            (error) => {
                const message = error.message || "";
                if (message.includes("permission-denied")) {
                    setMembersError(
                        "Missing Firestore permission to read members.",
                    );
                } else {
                    setMembersError("Could not load family members.");
                }
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [user?.familyId]);

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
                            Family Group
                        </Text>
                        <Text className="mt-1 text-[35px] font-black tracking-tight text-text-primary">
                            {family?.name || "Loading..."}
                        </Text>
                        <Text className="mt-1 text-[15px] leading-6 text-text-secondary">
                            {members.length} member
                            {members.length === 1 ? "" : "s"} in this family
                        </Text>
                    </View>
                    <View className="items-center">
                        <View className="h-11 w-11 items-center justify-center rounded-full border border-border-muted bg-surface/95">
                            <Users
                                stroke="#59AC77"
                                size={19}
                                strokeWidth={2.3}
                            />
                        </View>
                        <Text className="mt-1 text-[11px] font-medium text-text-muted">
                            Members
                        </Text>
                    </View>
                </View>
            </View>

            <View className="px-6">
                <View
                    className="mb-6 rounded-3xl border border-border-muted/80 p-5"
                    style={{
                        backgroundColor: "rgba(255,255,255,0.62)",
                        shadowColor: "#4f5f56",
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.06,
                        shadowRadius: 14,
                        elevation: 2,
                    }}
                >
                    <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-primary-700">
                        Invite Family Members
                    </Text>
                    <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-border-muted/80 bg-surface/80 p-4">
                        <Text className="text-[30px] font-black tracking-[3px] text-text-primary">
                            {family?.inviteCode || "----"}
                        </Text>
                        <TouchableOpacity
                            onPress={handleShare}
                            activeOpacity={0.8}
                            className="rounded-xl border border-border-muted/80 bg-surface p-3"
                        >
                            <Share2
                                stroke="#59AC77"
                                size={20}
                                strokeWidth={2.5}
                            />
                        </TouchableOpacity>
                    </View>
                    <Text className="mt-3 text-[14px] leading-6 text-text-secondary">
                        Share this code with family members to join your grocery
                        list.
                    </Text>
                </View>

                <Text className="mb-3 text-[12px] font-semibold uppercase tracking-[1.3px] text-text-muted">
                    Family Members ({members.length})
                </Text>

                {membersError ? (
                    <Text className="mb-4 text-sm text-urgent">
                        {membersError}
                    </Text>
                ) : null}

                {loading ? (
                    <ActivityIndicator color="#59AC77" size="large" />
                ) : (
                    <FlatList
                        data={members}
                        keyExtractor={(item) => item.uid}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 140 }}
                        renderItem={({ item }) => (
                            <View
                                className="mb-2.5 flex-row items-center rounded-2xl border border-border-muted/80 px-4 py-4"
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.58)",
                                }}
                            >
                                <View className="mr-4 h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border-muted bg-primary-50">
                                    {item.photoURL ? (
                                        <Image
                                            source={{ uri: item.photoURL }}
                                            className="h-full w-full"
                                        />
                                    ) : (
                                        <UserIcon
                                            stroke="#59AC77"
                                            size={22}
                                            strokeWidth={2}
                                        />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-[18px] font-semibold tracking-tight text-text-primary">
                                        {item.displayName}
                                    </Text>
                                    <Text className="text-[13px] text-text-muted">
                                        {item.email}
                                    </Text>
                                </View>
                                {item.role === "owner" ? (
                                    <View className="flex-row items-center rounded-full border border-border-muted/80 bg-primary-50 px-3 py-1.5">
                                        <Crown
                                            stroke="#4a9a68"
                                            size={12}
                                            strokeWidth={2.5}
                                        />
                                        <Text className="ml-1 text-[11px] font-semibold text-primary-700">
                                            Owner
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default MembersScreen;
