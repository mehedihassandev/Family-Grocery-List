import React, { useMemo, useState } from "react";
import { HomeStackScreenProps } from "../types";
import { ScrollView, StatusBar, Text, View, TouchableOpacity, Image, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Users,
  UsersRound,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Plus,
  Share2,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  useFamilyDetails,
  useFamilyMembers,
  useFamilyGroceryItemsBackend,
  useDateFormatter,
  useTextFormatter,
} from "../hooks";
import { Card, ShortcutCard, ProgressBar, DonutChart, PriorityBadge } from "../components/ui";
import { RecipePacksModal } from "../components/RecipePacksModal";
import { useNotificationStore } from "../store/useNotificationStore";
import { ERootRoutes } from "../navigation/routes";

/**
 * Premium Compact Dashboard Screen
 * Why: Eliminates unnecessary vertical scrolling by consolidating metrics and quick actions into a unified layout.
 */
const DashboardScreen = ({ navigation, onTabChange }: HomeStackScreenProps) => {
  const { user } = useAuthStore();
  const { toDate } = useDateFormatter();
  const { toInitial, toTrimmed } = useTextFormatter();

  const [isRecipePacksOpen, setRecipePacksOpen] = useState(false);

  // TanStack Query Hooks
  const { data: family } = useFamilyDetails(user?.familyId);
  const { data: members = [] } = useFamilyMembers(user?.familyId);
  const { data: items = [] } = useFamilyGroceryItemsBackend(user?.familyId);

  const familyName = family?.name || "Our Family";

  const handleShareInvite = async () => {
    const rawFamily = family as unknown as Record<string, string> | null;
    const inviteCode = family?.inviteCode || rawFamily?.invite_code || rawFamily?.code;
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Join our family grocery list! Use invite code: ${inviteCode}`,
      });
    } catch {
      // ignore
    }
  };

  const notifications = useNotificationStore((state) => state.notifications);
  const notificationError = useNotificationStore((state) => state.error);
  const unreadCount = notifications.filter(
    (notification) =>
      notification.actorId !== user?.uid && !notification.readBy.includes(user?.uid || ""),
  ).length;

  // Stats Calculations
  const pendingItems = useMemo(() => items.filter((item) => item.status === "pending"), [items]);
  const completedItems = useMemo(
    () => items.filter((item) => item.status === "completed"),
    [items],
  );

  const pendingCount = pendingItems.length;
  const completedCount = completedItems.length;
  const totalCount = items.length;
  const urgentCount = pendingItems.filter((item) => item.priority === "Urgent").length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const estimatedSpend = useMemo(() => {
    return items.reduce((sum, item) => {
      if (typeof item.estimatedTotal === "number" && Number.isFinite(item.estimatedTotal)) {
        return sum + item.estimatedTotal;
      }
      if (typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice)) {
        return sum + item.unitPrice;
      }
      return sum;
    }, 0);
  }, [items]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    items.forEach((item) => {
      stats[item.category] = (stats[item.category] || 0) + 1;
    });
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [items]);

  const recentPending = useMemo(() => {
    return pendingItems
      .sort((a, b) => {
        const aDate = toDate(a.createdAt)?.getTime() ?? 0;
        const bDate = toDate(b.createdAt)?.getTime() ?? 0;
        return bDate - aDate;
      })
      .slice(0, 3);
  }, [pendingItems, toDate]);

  const nextItem = recentPending[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = useMemo(() => {
    const normalized = toTrimmed(user?.displayName);
    if (!normalized) return "Friend";
    return normalized.split(/\s+/)[0];
  }, [toTrimmed, user?.displayName]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      {/* Header Row */}
      <View className="px-6 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-11 w-11 rounded-2xl bg-primary-600 items-center justify-center overflow-hidden border-2 border-white shadow-xs">
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-white font-bold text-lg">{toInitial(firstName)}</Text>
            )}
          </View>
          <View className="ml-3">
            <Text className="text-text-muted text-[12px] font-medium">{getGreeting()}</Text>
            <Text className="text-text-primary text-[18px] font-bold tracking-tight">
              {user?.displayName} 👋
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate(ERootRoutes.NOTIFICATIONS)}
          className="h-11 w-11 rounded-2xl bg-white items-center justify-center border border-border shadow-xs"
        >
          <Bell size={20} stroke="#10B981" />
          {unreadCount > 0 ? (
            <View className="absolute -right-1 -top-1 h-4 min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-danger px-1">
              <Text className="text-[8px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
      >
        <View className="px-6 pt-2">
          {notificationError ? (
            <View className="mb-3 rounded-2xl border border-warning-light bg-warning-light/40 px-4 py-2.5">
              <View className="flex-row items-start">
                <AlertTriangle size={15} stroke="#F59E0B" />
                <Text className="ml-2 flex-1 text-[11px] font-medium leading-4 text-warning-dark">
                  Live activity feed issue: {notificationError}
                </Text>
              </View>
            </View>
          ) : null}

          {user?.familyId ? (
            <>
              {/* Unified Hero Family Hub Card */}
              <Card padding={false} className="mb-5 overflow-hidden">
                <View className="h-1.5 w-full bg-primary-500" />
                <View className="p-5">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="mr-3">
                        <Text className="text-primary-600 text-[10px] font-bold uppercase tracking-[1px]">
                          Family Group
                        </Text>
                        <Text className="text-text-primary text-xl font-bold tracking-tight">
                          {familyName}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-border">
                      <View className="flex-row mr-2">
                        {(members || []).slice(0, 3).map((m, i) => (
                          <View
                            key={m.uid}
                            className={`h-5 w-5 rounded-full border border-white items-center justify-center ${i > 0 ? "-ml-1.5" : ""}`}
                            style={{
                              backgroundColor:
                                i === 0 ? "#10B981" : i === 1 ? "#3B82F6" : "#F59E0B",
                            }}
                          >
                            <Text className="text-white text-[8px] font-bold">
                              {toInitial(m.displayName)}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <Text className="text-[11px] font-bold text-text-secondary">
                        {(members || []).length} member{(members || []).length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar & Financial Spend Row */}
                  <View className="mb-4 bg-slate-50 p-3.5 rounded-2xl border border-border/80">
                    <View className="flex-row justify-between items-center mb-1.5">
                      <Text className="text-[12px] font-bold text-text-primary">
                        Shopping Progress
                      </Text>
                      <Text className="text-[12px] font-bold text-primary-600">
                        {completionRate}% ({completedCount}/{totalCount})
                      </Text>
                    </View>
                    <ProgressBar progress={completionRate} height={8} />
                    <View className="flex-row justify-between items-center mt-1">
                      <Text className="text-[11px] text-text-muted font-medium">
                        Est. Spend:{" "}
                        <Text className="font-bold text-text-primary">
                          ${estimatedSpend.toFixed(2)}
                        </Text>
                      </Text>
                      <Text className="text-[11px] text-warning-dark font-bold">
                        {pendingCount} left to buy
                      </Text>
                    </View>
                  </View>

                  {/* 3-Stat Metric Grid */}
                  <View className="flex-row bg-surface-alt rounded-2xl p-3 border border-border/60 justify-between">
                    <View className="flex-1 items-center">
                      <Clock size={16} stroke="#3B82F6" className="mb-1" />
                      <Text className="text-xl font-bold text-text-primary">{pendingCount}</Text>
                      <Text className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                        Pending
                      </Text>
                    </View>
                    <View className="w-[1px] bg-border/60 my-1" />
                    <View className="flex-1 items-center">
                      <CheckCircle2 size={16} stroke="#10B981" className="mb-1" />
                      <Text className="text-xl font-bold text-text-primary">{completedCount}</Text>
                      <Text className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                        Done
                      </Text>
                    </View>
                    <View className="w-[1px] bg-border/60 my-1" />
                    <View className="flex-1 items-center">
                      <AlertCircle size={16} stroke="#EF4444" className="mb-1" />
                      <Text className="text-xl font-bold text-text-primary">{urgentCount}</Text>
                      <Text className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                        Urgent
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>

              {/* Quick Actions Hub */}
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2.5">
                  <Text className="text-text-primary text-[14px] font-bold tracking-tight">
                    Quick Actions
                  </Text>
                  <Text className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    Shortcuts
                  </Text>
                </View>
                <View className="flex-row items-center justify-between bg-white rounded-2xl p-3.5 border border-border/70 shadow-2xs">
                  <ShortcutCard
                    icon={Plus}
                    label="Add Item"
                    onPress={() => navigation.navigate(ERootRoutes.ADD_ITEM)}
                    iconBgColor="bg-emerald-50/80"
                    iconColor="#059669"
                  />
                  <ShortcutCard
                    icon={Sparkles}
                    label="Recipe AI"
                    onPress={() => setRecipePacksOpen(true)}
                    iconBgColor="bg-purple-50/80"
                    iconColor="#7C3AED"
                  />
                  <ShortcutCard
                    icon={Users}
                    label="Family"
                    onPress={() => (navigation as any).navigate("Family")}
                    iconBgColor="bg-amber-50/80"
                    iconColor="#D97706"
                  />
                  <ShortcutCard
                    icon={Share2}
                    label="Invite Family"
                    onPress={handleShareInvite}
                    iconBgColor="bg-blue-50/80"
                    iconColor="#2563EB"
                  />
                </View>
              </View>

              {/* Priority Focus Section */}
              <View className="mb-5">
                <Text className="text-text-primary text-[15px] font-bold tracking-tight mb-3">
                  Priority Focus
                </Text>
                {nextItem ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => (navigation as any).navigate("Groceries")}
                  >
                    <Card className="border-primary-100 bg-primary-50/20 p-4 border-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-primary-600 text-[10px] font-black uppercase tracking-wider">
                          Next Up
                        </Text>
                        <PriorityBadge priority={nextItem.priority} />
                      </View>
                      <Text className="text-text-primary text-[18px] font-bold leading-tight">
                        {nextItem.name} —{" "}
                        <Text className="text-text-secondary font-medium">{nextItem.category}</Text>
                      </Text>
                      <View className="flex-row justify-between items-center mt-3">
                        <Text className="text-text-muted text-[11px] font-medium">
                          Added by {nextItem.addedBy?.name || "Member"}
                        </Text>
                        <View className="flex-row items-center">
                          <Text className="text-primary-600 text-[12px] font-bold mr-1">
                            Open List
                          </Text>
                          <ArrowRight size={14} stroke="#10B981" />
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ) : (
                  <Card className="p-5 items-center justify-center">
                    <CheckCircle2 size={24} stroke="#10B981" className="mb-2" />
                    <Text className="text-[14px] font-bold text-text-primary">
                      All caught up! No pending items.
                    </Text>
                  </Card>
                )}
              </View>

              {/* 1-Click Meal Packs Banner */}
              <View className="mb-5">
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => setRecipePacksOpen(true)}
                  className="overflow-hidden rounded-3xl bg-primary-600 p-5 shadow-sm border border-primary-500"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-[18px] font-bold text-white tracking-tight">
                        1-Click Meal Packs 🌮🍝
                      </Text>
                      <Text className="mt-1 text-[12px] font-medium text-primary-100 leading-4">
                        Taco Night, Italian Pasta, Sunday Brunch, & Healthy Prep packs.
                      </Text>
                    </View>
                    <View className="h-11 px-4 rounded-xl bg-white items-center justify-center">
                      <Text className="text-[12px] font-bold text-primary-700">Explore</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Overview Breakdown */}
              <View className="mb-5">
                <Text className="text-text-primary text-[15px] font-bold tracking-tight mb-3">
                  Overview Breakdown
                </Text>
                <Card className="p-4">
                  <View className="flex-row items-center">
                    <DonutChart
                      total={totalCount}
                      data={[
                        { value: completedCount, color: "#10B981" },
                        { value: Math.max(0, pendingCount - urgentCount), color: "#F59E0B" },
                        { value: urgentCount, color: "#EF4444" },
                      ]}
                      size={90}
                      strokeWidth={10}
                    />
                    <View className="ml-5 flex-1">
                      {categoryStats.map(([cat, count]) => (
                        <ProgressBar
                          key={cat}
                          label={cat}
                          progress={(count / (totalCount || 1)) * 100}
                          color={cat === "Beauty" ? "#10B981" : "#F59E0B"}
                          height={6}
                        />
                      ))}
                    </View>
                  </View>
                </Card>
              </View>
            </>
          ) : (
            <Card className="mb-6 py-8 items-center">
              <View className="h-16 w-16 rounded-2xl bg-primary-50 items-center justify-center mb-4">
                <UsersRound size={32} stroke="#10B981" strokeWidth={1.5} />
              </View>
              <Text className="text-xl font-bold text-text-primary text-center px-4 tracking-tight">
                Set Up Your Family Group
              </Text>
              <Text className="text-text-secondary text-center mt-2 mb-6 px-6 text-[13px] leading-5">
                Create or join a family group to unlock shared grocery list, members & meal packs.
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate(ERootRoutes.FAMILY_SETUP)}
                activeOpacity={0.8}
                className="w-[85%] rounded-2xl bg-primary-600 py-3 items-center"
              >
                <Text className="text-white font-bold text-[14px]">Continue Setup</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>
      </ScrollView>

      <RecipePacksModal visible={isRecipePacksOpen} onClose={() => setRecipePacksOpen(false)} />
    </SafeAreaView>
  );
};

export default DashboardScreen;
