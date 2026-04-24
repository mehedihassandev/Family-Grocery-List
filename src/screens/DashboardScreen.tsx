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
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background dark:bg-background-dark">
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
              <View className="flex-row p-5">
                {/* Left Side: Family Overview */}
                <View className="flex-1 pr-3 justify-between">
                  <View>
                    <Text className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                      Family Group
                    </Text>
                    <Text
                      className="text-[26px] font-black tracking-tight text-text-primary dark:text-text-dark-primary mt-1 leading-tight"
                      numberOfLines={2}
                    >
                      {familyName}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Users size={12} stroke={isDark ? "#94a399" : "#748379"} />
                      <Text className="text-[12px] text-text-muted dark:text-text-dark-muted ml-1 font-medium">
                        {memberCount} Member{memberCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("Members")}
                    className="mt-6 self-start rounded-full bg-primary-600 dark:bg-primary-500 py-2 px-5 flex-row items-center justify-center"
                  >
                    <Text className="text-[13px] font-bold text-white mr-1">Manage</Text>
                    <ChevronRight stroke="white" size={14} strokeWidth={3} />
                  </TouchableOpacity>
                </View>

                {/* Right Side: Stats Grid */}
                <View className="w-[120px] border-l border-border-muted dark:border-border-dark pl-4 justify-center">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("List")}
                    className="flex-row items-center mb-4"
                  >
                    <View className="h-8 w-8 rounded-full bg-secondary-100 dark:bg-secondary-900/30 items-center justify-center mr-2.5">
                      <Clock stroke={isDark ? "#adbfcb" : "#637889"} size={14} strokeWidth={2.5} />
                    </View>
                    <View>
                      <Text className="text-[15px] font-bold text-text-primary dark:text-text-dark-primary leading-none">
                        {pendingCount}
                      </Text>
                      <Text className="text-[9px] text-text-muted dark:text-text-dark-muted font-bold uppercase tracking-wide mt-0.5">
                        Pending
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("List")}
                    className="flex-row items-center mb-4"
                  >
                    <View className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center mr-2.5">
                      <CheckCircle2 stroke="#59AC77" size={14} strokeWidth={2.5} />
                    </View>
                    <View>
                      <Text className="text-[15px] font-bold text-text-primary dark:text-text-dark-primary leading-none">
                        {completedCount}
                      </Text>
                      <Text className="text-[9px] text-text-muted dark:text-text-dark-muted font-bold uppercase tracking-wide mt-0.5">
                        Done
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("List")}
                    className="flex-row items-center"
                  >
                    <View className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 items-center justify-center mr-2.5">
                      <AlertCircle stroke="#c36262" size={14} strokeWidth={2.5} />
                    </View>
                    <View>
                      <Text className="text-[15px] font-bold text-text-primary dark:text-text-dark-primary leading-none">
                        {urgentCount}
                      </Text>
                      <Text className="text-[9px] text-text-muted dark:text-text-dark-muted font-bold uppercase tracking-wide mt-0.5">
                        Urgent
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ) : (
            <Card className="bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800 items-center py-8">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-primary-900/20 shadow-sm">
                <UsersRound stroke="#59AC77" size={32} strokeWidth={2.2} />
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
                  iconColor="#59AC77"
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
                  iconColor="#59AC77"
                  iconBgColor="bg-primary-50 dark:bg-primary-900/20"
                  onPress={() => navigation.navigate("List")}
                />
                <ShortcutCard
                  icon={Users}
                  label="Members"
                  iconColor="#59AC77"
                  iconBgColor="bg-primary-50 dark:bg-primary-900/20"
                  onPress={() => navigation.navigate("Members")}
                />
                <ShortcutCard
                  icon={BarChart3}
                  label="Analyze"
                  iconColor="#59AC77"
                  iconBgColor="bg-primary-50 dark:bg-primary-900/20"
                  onPress={() => navigation.navigate("Analyze")}
                />
              </>
            )}
            <ShortcutCard
              icon={UserCircle2}
              label="Profile"
              iconColor="#59AC77"
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
                <Text className="text-[13px] font-bold text-primary-600 dark:text-primary-400">View All</Text>
              </TouchableOpacity>
            </View>
            
            {recentPending.length === 0 ? (
              <Card className="items-center py-6 border-dashed">
                <Text className="text-[14px] font-medium text-text-muted dark:text-text-dark-muted">No pending items right now.</Text>
              </Card>
            ) : (
              recentPending.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("List")}
                  className="mb-3"
                >
                  <Card className="py-4">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-[16px] font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
                          {item.name}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <View className="h-2 w-2 rounded-full bg-primary-400 mr-2" />
                          <Text className="text-[12px] text-text-muted dark:text-text-dark-muted font-medium">
                            {item.category}
                          </Text>
                        </View>
                      </View>
                      <View className="rounded-full bg-background dark:bg-background-dark px-3 py-1 border border-border-muted dark:border-border-dark">
                        <Text className="text-[10px] font-bold text-text-muted dark:text-text-dark-muted uppercase">
                          {item.priority}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
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
