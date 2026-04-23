import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StatusBar, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  BarChart3,
  ShoppingBasket,
  UserCircle2,
  Users,
  UsersRound,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { getFamilyDetails, subscribeToFamilyMembers } from "../services/family";
import { subscribeToGroceryList } from "../services/grocery";
import { Family, GroceryItem } from "../types";
import { AppHeader, ShortcutCard } from "../components/ui";
import NotificationModal from "../components/NotificationModal";

const toDate = (value: any): Date | null => {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [familyName, setFamilyName] = useState("Our Family");
  const [memberCount, setMemberCount] = useState(0);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isNotifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!user?.familyId) return;

    let mounted = true;
    void getFamilyDetails(user.familyId)
      .then((family) => {
        if (!mounted) return;
        const name = (family as Family | undefined)?.name?.trim();
        setFamilyName(name || "Our Family");
      })
      .catch(() => {
        if (mounted) setFamilyName("Our Family");
      });

    return () => {
      mounted = false;
    };
  }, [user?.familyId]);

  useEffect(() => {
    if (!user?.familyId) {
      setMemberCount(0);
      return;
    }

    const unsubscribe = subscribeToFamilyMembers(
      user.familyId,
      (members) => setMemberCount(members.length),
      () => setMemberCount(0),
    );

    return () => unsubscribe();
  }, [user?.familyId]);

  useEffect(() => {
    if (!user?.familyId) {
      setItems([]);
      return;
    }

    const unsubscribe = subscribeToGroceryList(
      user.familyId,
      (nextItems) => setItems(nextItems),
      () => setItems([]),
    );

    return () => unsubscribe();
  }, [user?.familyId]);

  const pendingCount = items.filter((item) => item.status === "pending").length;
  const completedCount = items.filter((item) => item.status === "completed").length;
  const urgentCount = items.filter(
    (item) => item.status === "pending" && item.priority === "Urgent",
  ).length;

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return items.filter((item) => {
      const created = toDate(item.createdAt);
      if (!created) return false;
      return created >= start && created < end;
    }).length;
  }, [items]);

  const recentPending = useMemo(() => {
    return items
      .filter((item) => item.status === "pending")
      .sort((a, b) => {
        const aDate = toDate(a.createdAt)?.getTime() ?? 0;
        const bDate = toDate(b.createdAt)?.getTime() ?? 0;
        return bDate - aDate;
      })
      .slice(0, 3);
  }, [items]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      <AppHeader title="Home" eyebrow="Dashboard" onNotificationPress={() => setNotifOpen(true)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View className="px-6 pt-4">
          {user?.familyId ? (
            <View
              className="relative rounded-3xl border border-border-muted bg-surface px-5 py-5 flex-row justify-between"
              style={{
                shadowColor: "#1f2a25",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.03,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              {/* Left Side: Family Overview */}
              <View className="flex-1 pr-3 justify-between">
                <View>
                  <Text className="text-[13px] font-bold text-text-primary tracking-wide">
                    Family Group
                  </Text>
                  <Text
                    className="text-[30px] font-black tracking-tight text-text-primary mt-1 leading-[36px]"
                    numberOfLines={2}
                  >
                    {familyName}
                  </Text>
                  <Text className="text-[12px] text-text-muted mt-2">
                    {memberCount} Member{memberCount === 1 ? "" : "s"} · {thisMonthCount} Item
                    {thisMonthCount === 1 ? "" : "s"} Created
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("Members")}
                  className="mt-6 self-start rounded-full border border-primary-400 py-1.5 px-4 flex-row items-center justify-center bg-surface"
                >
                  <Text className="text-[12px] font-medium text-primary-600 mr-1">Manage</Text>
                  <ChevronRight stroke="#59AC77" size={14} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Right Side: Stats Panel */}
              <View className="justify-center border-l flex-row border-dashed border-border-muted/80 pl-4 py-1">
                <View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("List")}
                    className="flex-row items-center mb-3"
                  >
                    <View className="h-8 w-8 rounded-lg bg-slate-100 items-center justify-center mr-3">
                      <Clock stroke="#64748b" size={16} strokeWidth={2.5} />
                    </View>
                    <View className="w-16">
                      <Text className="text-[16px] font-bold text-text-primary leading-tight">
                        {pendingCount}
                      </Text>
                      <Text className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wide">
                        Pending
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View className="h-[1px] w-[110px] border-b border-dashed border-border-muted/80 mb-3" />

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("List")}
                    className="flex-row items-center mb-3"
                  >
                    <View className="h-8 w-8 rounded-lg bg-primary-50 items-center justify-center mr-3">
                      <CheckCircle2 stroke="#59AC77" size={16} strokeWidth={2.5} />
                    </View>
                    <View className="w-16">
                      <Text className="text-[16px] font-bold text-text-primary leading-tight">
                        {completedCount}
                      </Text>
                      <Text className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wide">
                        Done
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View className="h-[1px] w-[110px] border-b border-dashed border-border-muted/80 mb-3" />

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("List")}
                    className="flex-row items-center"
                  >
                    <View className="h-8 w-8 rounded-lg bg-orange-50 items-center justify-center mr-3">
                      <AlertCircle stroke="#f59e0b" size={16} strokeWidth={2.5} />
                    </View>
                    <View className="w-16">
                      <Text className="text-[16px] font-bold text-text-primary leading-tight">
                        {urgentCount}
                      </Text>
                      <Text className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wide">
                        Urgent
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View className="relative rounded-3xl border border-primary-200 bg-primary-50 px-5 py-6 items-center">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-white">
                <UsersRound stroke="#59AC77" size={28} strokeWidth={2} />
              </View>
              <Text className="text-[22px] font-black tracking-tight text-text-primary text-center">
                Welcome to Family Grocery
              </Text>
              <Text className="mt-2 text-[15px] leading-6 text-text-secondary text-center px-4">
                You are not in a family yet. Join an existing family using a code or create your own
                to start sharing lists!
              </Text>
            </View>
          )}
        </View>

        <View className="px-6 pt-6">
          <Text className="mb-3 text-[18px] font-bold tracking-tight text-text-primary">
            Shortcuts
          </Text>
          <View className="flex-row items-start justify-between">
            {!user?.familyId && (
              <>
                <ShortcutCard
                  icon={UsersRound}
                  label="Join Family"
                  iconColor="#3b82f6"
                  iconBgColor="bg-blue-50"
                  onPress={() => navigation.navigate("JoinFamily")}
                />
                <ShortcutCard
                  icon={PlusCircle}
                  label="Create Family"
                  iconColor="#59AC77"
                  iconBgColor="bg-primary-50"
                  onPress={() => navigation.navigate("CreateFamily")}
                />
              </>
            )}
            {user?.familyId && (
              <>
                <ShortcutCard
                  icon={ShoppingBasket}
                  label="List"
                  iconColor="#59AC77"
                  iconBgColor="bg-primary-50"
                  onPress={() => navigation.navigate("List")}
                />
                <ShortcutCard
                  icon={Users}
                  label="Members"
                  iconColor="#59AC77"
                  iconBgColor="bg-primary-50"
                  onPress={() => navigation.navigate("Members")}
                />
                <ShortcutCard
                  icon={BarChart3}
                  label="Analyze"
                  iconColor="#59AC77"
                  iconBgColor="bg-primary-50"
                  onPress={() => navigation.navigate("Analyze")}
                />
              </>
            )}
            <ShortcutCard
              icon={UserCircle2}
              label="Profile"
              iconColor="#59AC77"
              iconBgColor="bg-primary-50"
              onPress={() => navigation.navigate("Profile")}
            />
          </View>
        </View>

        {user?.familyId && (
          <View className="px-6 pt-6">
            <Text className="mb-3 text-[18px] font-bold tracking-tight text-text-primary">
              Recent Pending
            </Text>
            {recentPending.length === 0 ? (
              <View className="rounded-2xl border border-border-muted bg-surface px-4 py-4">
                <Text className="text-[14px] text-text-secondary">No pending items right now.</Text>
              </View>
            ) : (
              recentPending.map((item) => (
                <View
                  key={item.id}
                  className="mb-2 rounded-2xl border border-border-muted bg-surface px-4 py-3"
                >
                  <Text className="text-[16px] font-semibold tracking-tight text-text-primary">
                    {item.name}
                  </Text>
                  <Text className="mt-0.5 text-[13px] text-text-muted">
                    {item.category} · {item.priority}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default DashboardScreen;
