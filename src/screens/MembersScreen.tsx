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
import { Share2, Crown, User as UserIcon } from "lucide-react-native";
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

  if (rawMessage.trim()) {
    return rawMessage.trim();
  }

  return fallback;
};

const MembersScreen = () => {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<User[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [isNotifOpen, setNotifOpen] = useState(false);

  const myRole = members.find((member) => member.uid === user?.uid)?.role ?? user?.role;
  const isOwner = myRole === "owner";

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
      console.error(error);
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
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      <AppHeader
        title="Members"
        eyebrow="My Family"
        onNotificationPress={() => setNotifOpen(true)}
      />

      <View className="px-6 flex-1 pt-4">
        <View className="mb-6 rounded-3xl bg-primary-50/80 p-6">
          <Text className="mb-3 text-[18px] font-bold tracking-tight text-text-primary">
            Invite Family Members
          </Text>
          <View className="mt-2 flex-row items-center justify-between rounded-2xl bg-surface px-5 py-4 shadow-sm">
            <Text className="text-[28px] font-black tracking-[4px] text-text-primary">
              {family?.inviteCode || "----"}
            </Text>
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.8}
              className="rounded-xl bg-primary-50 p-2.5"
            >
              <Share2 stroke="#59AC77" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text className="mt-4 text-[13px] font-medium leading-5 text-text-secondary">
            Share this code with family members to join your grocery list.
          </Text>
        </View>

        <Text className="mb-4 text-[18px] font-bold tracking-tight text-text-primary">
          Family Members ({members.length})
        </Text>

        {membersError ? <Text className="mb-4 text-sm text-urgent">{membersError}</Text> : null}

        {loading ? (
          <ActivityIndicator color="#59AC77" size="large" />
        ) : (
          <Card className="flex-1 pt-2 mb-6 overflow-hidden">
            <FlatList
              data={members}
              keyExtractor={(item) => item.uid}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item, index }) => {
                const isLast = index === members.length - 1;
                return (
                  <View
                    className={`mx-5 flex-row items-center py-4 ${
                      !isLast ? "border-b border-border-muted/60" : ""
                    }`}
                  >
                    <View className="mr-4 h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full bg-primary-100">
                      {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} className="h-full w-full" />
                      ) : (
                        <UserIcon stroke="#59AC77" size={20} strokeWidth={2} />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[16px] font-bold tracking-tight text-text-primary">
                        {item.displayName}
                      </Text>
                      <Text className="mt-0.5 text-[13px] font-medium text-text-secondary">
                        {item.email}
                      </Text>
                    </View>
                    {item.role === "owner" ? (
                      <View className="flex-row items-center rounded-lg bg-primary-50 px-2.5 py-1.5 ml-2">
                        <Crown stroke="#4a9a68" size={12} strokeWidth={2.5} />
                        <Text className="ml-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-700">
                          Owner
                        </Text>
                      </View>
                    ) : isOwner && item.uid !== user?.uid ? (
                      <TouchableOpacity
                        onPress={() => handleRemoveMember(item)}
                        disabled={removingMemberId === item.uid}
                        activeOpacity={0.8}
                        className="rounded-lg bg-urgent/10 px-3 py-1.5 ml-2"
                      >
                        {removingMemberId === item.uid ? (
                          <ActivityIndicator color="#c36262" size="small" />
                        ) : (
                          <Text className="text-[11px] font-bold uppercase tracking-wider text-urgent">
                            Remove
                          </Text>
                        )}
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              }}
            />
          </Card>
        )}
      </View>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default MembersScreen;
