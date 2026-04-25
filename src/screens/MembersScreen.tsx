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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { Share2, Crown, User as UserIcon, Trash2 } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  subscribeToFamilyMembers,
  getFamilyDetails,
  removeMemberAsOwner,
} from "../services/family";
import { User, Family } from "../types";
import { AppHeader, Card } from "../components/ui";
import NotificationModal from "../components/NotificationModal";

const getFamilyActionErrorMessage = (error: unknown, fallback: string) => {
  const rawMessage = error instanceof Error ? error.message : "";
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("permission-denied") || normalized.includes("insufficient permissions")) {
    return "Permission denied. Publish Firestore rules from FIRESTORE_RULES_SETUP.md";
  }

  return rawMessage.trim() || fallback;
};

/**
 * Family members management screen
 * Why: To allow users to see who is in their family, invite others via code, and manage membership (for owners).
 */
const MembersScreen = () => {
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const [members, setMembers] = useState<User[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isNotifOpen, setNotifOpen] = useState(false);

  const isDark = colorScheme === "dark";
  const myRole = members.find((member) => member.uid === user?.uid)?.role ?? user?.role;
  const isOwner = myRole === "owner";

  useEffect(() => {
    if (!user?.familyId) return;

    // Fetch family details (invite code)
    getFamilyDetails(user.familyId)
      .then(setFamily)
      .catch((error) => {
        console.error("[MembersScreen] getFamilyDetails error:", error);
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
          setMembersError("Missing Firestore permission to read members.");
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
      console.error("[MembersScreen] share error:", error);
    }
  };

  const handleRemoveMember = (member: User) => {
    if (!user?.uid || !user.familyId || !isOwner) return;
    const familyId = user.familyId;

    Alert.alert("Remove Member", `Remove ${member.displayName} from this family?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            setRemovingMemberId(member.uid);
            await removeMemberAsOwner({
              ownerId: user.uid,
              familyId,
              targetUserId: member.uid,
            });
          } catch (error) {
            const message = getFamilyActionErrorMessage(error, "Could not remove member.");
            Alert.alert("Remove Failed", message);
          } finally {
            setRemovingMemberId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <AppHeader
        title="Family Members"
        eyebrow="My Group"
        onNotificationPress={() => setNotifOpen(true)}
      />

      <View className="px-6 flex-1 pt-6">
        <Card className="mb-8 p-6 border-primary-100 bg-primary-50/50">
          <Text className="mb-4 text-[13px] font-bold uppercase tracking-[0.08em] text-primary-500">
            Invite Members
          </Text>
          <View className="flex-row items-center justify-between rounded-md bg-white border border-border px-5 py-4 shadow-xs">
            <View>
              <Text className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
                Family Code
              </Text>
              <Text className="text-[26px] font-black tracking-[4px] text-text-900">
                {family?.inviteCode || "----"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary-500 shadow-green"
            >
              <Share2 stroke="white" size={18} strokeWidth={3} />
            </TouchableOpacity>
          </View>
          <Text className="mt-4 text-[13px] leading-relaxed text-text-secondary">
            Share this code to collaborate with your family.
          </Text>
        </Card>

        <View className="flex-row items-center justify-between mb-4 px-1">
          <Text className="text-[18px] font-bold tracking-tight text-text-900">
            Members
          </Text>
          <View className="rounded-full bg-surface-alt px-3 py-1 border border-border">
            <Text className="text-[11px] font-bold text-text-muted">
              {members.length} Total
            </Text>
          </View>
        </View>

        {membersError ? (
          <View className="mb-4 rounded-md bg-danger-light p-3 border border-danger/20">
            <Text className="text-[12px] font-medium text-danger-dark">
              {membersError}
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#3DB87A" size="large" />
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.uid}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <Card className="mb-4 py-4 px-5">
                <View className="flex-row items-center">
                  <View className="mr-4 h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-surface-alt border border-border">
                    {item.photoURL ? (
                      <Image source={{ uri: item.photoURL }} className="h-full w-full" />
                    ) : (
                      <View className="h-full w-full bg-primary-100 items-center justify-center">
                        <Text className="text-primary-600 text-lg font-bold">
                          {item.displayName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-text-900">
                      {item.displayName}
                    </Text>
                    <Text className="mt-0.5 text-[12px] text-text-muted">
                      {item.email}
                    </Text>
                  </View>

                  {item.role === "owner" ? (
                    <View className="flex-row items-center rounded-sm bg-primary-100 px-3 py-1.5 border border-primary-200">
                      <Crown stroke="#2D6A4F" size={12} strokeWidth={2.5} />
                      <Text className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-600">
                        Owner
                      </Text>
                    </View>
                  ) : isOwner && item.uid !== user?.uid ? (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(item)}
                      disabled={removingMemberId === item.uid}
                      activeOpacity={0.7}
                      className="h-10 w-10 items-center justify-center rounded-full bg-danger-light border border-danger/20"
                    >
                      {removingMemberId === item.uid ? (
                        <ActivityIndicator color="#E55C5C" size="small" />
                      ) : (
                        <Trash2 stroke="#E55C5C" size={18} strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View className="rounded-sm bg-surface-muted px-3 py-1.5 border border-border">
                      <Text className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        Member
                      </Text>
                    </View>
                  )}
                </View>
              </Card>
            )}
          />
        )}
      </View>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default MembersScreen;
