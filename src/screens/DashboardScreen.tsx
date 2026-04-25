import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StatusBar, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
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
import { AppHeader, ShortcutCard, Card } from "../components/ui";
import NotificationModal from "../components/NotificationModal";

const toDate = (value: any): Date | null => {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

/**
 * Main dashboard screen (Home)
 * Why: To provide a high-level overview of family status, grocery list stats, and quick actions.
 */
const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const [familyName, setFamilyName] = useState("Our Family");
  const [memberCount, setMemberCount] = useState(0);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isNotifOpen, setNotifOpen] = useState(false);

  const isDark = colorScheme === "dark";

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

  const firstName = user?.displayName?.split(" ")[0] || "there";

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <AppHeader
        title={`Hello, ${firstName} 👋`}
        eyebrow="Dashboard"
        onNotificationPress={() => setNotifOpen(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        className="flex-1"
      >
        <View className="px-6 pt-6">
          {user?.familyId ? (
            <Card padding={false} className="overflow-hidden">
              <View className="h-[6px] w-full bg-primary-600" />
              <View className="p-5">
                <View className="flex-row items-center justify-between mb-6">
                  <View>
                    <Text className="text-[11px] font-bold text-primary-500 uppercase tracking-[0.08em]">
                      Family Group
                    </Text>
                    <Text
                      className="text-[24px] font-bold tracking-tight text-text-900 dark:text-text-dark-primary mt-1"
                      numberOfLines={1}
                    >
                      {familyName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("Members")}
                    className="h-10 w-10 items-center justify-center rounded-full bg-surface-alt border border-border"
                  >
                    <Users size={18} stroke="#4A5568" />
                  </TouchableOpacity>
                </View>

                {/* 3-Column Stats Grid */}
                <View className="flex-row items-center justify-between bg-surface-alt rounded-md p-4 border border-border">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("List")}
                    className="flex-1 items-center"
                  >
                    <Clock stroke="#4A90D9" size={16} strokeWidth={2.5} className="mb-2" />
                    <Text className="text-[18px] font-bold text-text-900 leading-none">
                      {pendingCount}
                    </Text>
                    <Text className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-1.5">
                      Pending
                    </Text>
                  </TouchableOpacity>

                  <View className="h-8 w-[1px] bg-border" />

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("List")}
                    className="flex-1 items-center"
                  >
                    <CheckCircle2 stroke="#3DB87A" size={16} strokeWidth={2.5} className="mb-2" />
                    <Text className="text-[18px] font-bold text-text-900 leading-none">
                      {completedCount}
                    </Text>
                    <Text className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-1.5">
                      Done
                    </Text>
                  </TouchableOpacity>

                  <View className="h-8 w-[1px] bg-border" />

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("List")}
                    className="flex-1 items-center"
                  >
                    <AlertCircle stroke="#E55C5C" size={16} strokeWidth={2.5} className="mb-2" />
                    <Text className="text-[18px] font-bold text-text-900 leading-none">
                      {urgentCount}
                    </Text>
                    <Text className="text-[9px] text-text-muted font-bold uppercase tracking-wider mt-1.5">
                      Urgent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ) : (
            <Card className="bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800 items-center py-8">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-primary-900/20 shadow-sm">
                <UsersRound stroke="#3DB87A" size={32} strokeWidth={2.2} />
              </View>
              <Text className="text-[24px] font-black tracking-tight text-text-primary dark:text-text-dark-primary text-center">
                Welcome to Family Grocery
              </Text>
              <Text className="mt-2 text-[15px] leading-6 text-text-secondary dark:text-text-dark-secondary text-center px-4">
                You are not in a family yet. Join an existing family using a code or create your own
                to start sharing lists!
              </Text>
            </Card>
          )}
        </View>

        <View className="px-6 pt-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[18px] font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
              Shortcuts
            </Text>
          </View>
          <View className="flex-row items-start justify-between bg-surface dark:bg-surface-dark rounded-3xl p-6 border border-border-muted dark:border-border-dark">
            {!user?.familyId && (
              <>
                <ShortcutCard
                  icon={UsersRound}
                  label="Join Family"
                  iconColor="#3b82f6"
                  iconBgColor="bg-blue-50 dark:bg-blue-900/20"
                  onPress={() => navigation.navigate("JoinFamily")}
                />
                <ShortcutCard
                  icon={PlusCircle}
                  label="Create Family"
                  iconColor="#3DB87A"
                  iconBgColor="bg-primary-50 dark:bg-primary-900/20"
                  onPress={() => navigation.navigate("CreateFamily")}
                />
              </>
            )}
            {user?.familyId && (
              <>
                <ShortcutCard
                  icon={ShoppingBasket}
                  label="List"
                  iconColor="#3DB87A"
                  iconBgColor="bg-primary-50 dark:bg-primary-900/20"
                  onPress={() => navigation.navigate("List")}
                />
                <ShortcutCard
                  icon={Users}
                  label="Members"
                  iconColor="#3DB87A"
                  iconBgColor="bg-primary-50 dark:bg-primary-900/20"
                  onPress={() => navigation.navigate("Members")}
                />
                <ShortcutCard
                  icon={BarChart3}
                  label="Analyze"
                  iconColor="#3DB87A"
                  iconBgColor="bg-primary-50 dark:bg-primary-900/20"
                  onPress={() => navigation.navigate("Analyze")}
                />
              </>
            )}
            <ShortcutCard
              icon={UserCircle2}
              label="Profile"
              iconColor="#3DB87A"
              iconBgColor="bg-primary-50 dark:bg-primary-900/20"
              onPress={() => navigation.navigate("Profile")}
            />
          </View>
        </View>

        {user?.familyId && (
          <View className="px-6 pt-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[18px] font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
                Recent Pending
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("List")}>
                <Text className="text-[13px] font-bold text-primary-600 dark:text-primary-400">
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            {recentPending.length === 0 ? (
              <Card className="items-center py-10 border-dashed border-2">
                <Text className="text-[14px] font-medium text-text-muted dark:text-text-dark-muted">
                  All caught up! No pending items.
                </Text>
              </Card>
            ) : (
              recentPending.map((item) => {
                const priorityColor =
                  item.priority === "Urgent"
                    ? "#E55C5C"
                    : item.priority === "Medium"
                      ? "#F5A623"
                      : "#3DB87A";

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("List")}
                    className="mb-4"
                  >
                    <Card padding={false} className="overflow-hidden flex-row h-[72px]">
                      <View style={{ width: 4, backgroundColor: priorityColor }} />
                      <View className="flex-1 px-5 justify-center">
                        <Text
                          className="text-[16px] font-bold text-text-900 dark:text-text-dark-primary"
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <Text className="text-[12px] text-text-muted mt-0.5" numberOfLines={1}>
                          {item.category}
                        </Text>
                      </View>
                      <View className="pr-5 justify-center">
                        <View
                          className="rounded-md px-2.5 py-1 border"
                          style={{
                            backgroundColor: `${priorityColor}10`,
                            borderColor: `${priorityColor}20`,
                          }}
                        >
                          <Text
                            className="text-[9px] font-bold uppercase tracking-widest"
                            style={{ color: priorityColor }}
                          >
                            {item.priority}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default DashboardScreen;
