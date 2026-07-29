import React, { useMemo } from "react";
import { HomeStackScreenProps, ROUTES } from "../types";
import { ScrollView, StatusBar, Text, View, TouchableOpacity, Image, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
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
  ChevronRight,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  useFamilyDetails,
  useFamilyMembers,
  useFamilyGroceryItemsBackend,
  useDateFormatter,
  useTextFormatter,
} from "../hooks";
import { ShortcutCard, ProgressBar, DonutChart, PriorityBadge } from "../components/ui";
import { useNotificationStore } from "../store/useNotificationStore";

/**
 * Cardless Dashboard Screen
 * Why: Pure white canvas, zero boxed cards, typography-driven sections.
 */
const DashboardScreen = ({ navigation }: HomeStackScreenProps) => {
  const { user } = useAuthStore();
  const { toDate } = useDateFormatter();
  const { toInitial, toTrimmed } = useTextFormatter();

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
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header Row */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        className="px-6 py-3 flex-row items-center justify-between border-b border-slate-100"
      >
        <View className="flex-row items-center">
          <View className="h-10 w-10 rounded-full bg-emerald-600 items-center justify-center overflow-hidden border border-emerald-500">
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-white font-bold text-base">{toInitial(firstName)}</Text>
            )}
          </View>
          <View className="ml-3">
            <Text className="text-slate-400 text-[11px] font-medium">{getGreeting()}</Text>
            <Text className="text-slate-900 text-[17px] font-extrabold tracking-tight">
              {user?.displayName} 👋
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
          className="h-9 w-9 rounded-full bg-slate-50 items-center justify-center border border-slate-100"
        >
          <Bell size={17} stroke="#059669" />
          {unreadCount > 0 ? (
            <View className="absolute -right-1 -top-1 h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-1 border border-white">
              <Text className="text-[8px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 bg-white"
      >
        <View className="px-6 pt-3">
          {notificationError ? (
            <View className="mb-3 p-3 rounded-xl border border-amber-200 bg-amber-50">
              <View className="flex-row items-start">
                <AlertTriangle size={15} stroke="#D97706" />
                <Text className="ml-2 flex-1 text-[11px] font-medium leading-4 text-amber-900">
                  Live activity feed issue: {notificationError}
                </Text>
              </View>
            </View>
          ) : null}

          {user?.familyId ? (
            <>
              {/* Family Hub Header (Cardless with Breathing Space) */}
              <Animated.View
                entering={FadeInDown.duration(350).springify()}
                className="py-6 border-b border-slate-100"
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-emerald-600 text-[11px] font-extrabold uppercase tracking-wider mb-0.5">
                      Family Group
                    </Text>
                    <Text className="text-slate-900 text-2xl font-black tracking-tight">
                      {familyName}
                    </Text>
                  </View>

                  <View className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <View className="flex-row mr-2">
                      {(members || []).slice(0, 3).map((m, i) => (
                        <View
                          key={m.uid}
                          className={`h-5 w-5 rounded-full border border-white items-center justify-center ${
                            i > 0 ? "-ml-2" : ""
                          }`}
                          style={{
                            backgroundColor: i === 0 ? "#10B981" : i === 1 ? "#3B82F6" : "#F59E0B",
                          }}
                        >
                          <Text className="text-white text-[8px] font-bold">
                            {toInitial(m.displayName)}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text className="text-[11px] font-bold text-slate-600">
                      {(members || []).length} member{(members || []).length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar & Financial Spend */}
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[13px] font-bold text-slate-800">Shopping Progress</Text>
                    <Text className="text-[13px] font-extrabold text-emerald-600">
                      {completionRate}% ({completedCount}/{totalCount})
                    </Text>
                  </View>
                  <ProgressBar progress={completionRate} height={6} />
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-[12px] text-slate-500 font-medium">
                      Est. Spend:{" "}
                      <Text className="font-bold text-slate-900">৳{estimatedSpend.toFixed(0)}</Text>
                    </Text>
                    <Text className="text-[12px] text-amber-700 font-bold">
                      {pendingCount} left to buy
                    </Text>
                  </View>
                </View>

                {/* 3-Stat Metric Grid */}
                <View className="flex-row py-3 justify-between items-center">
                  <View className="flex-1 items-center">
                    <Clock size={16} stroke="#3B82F6" className="mb-1" />
                    <Text className="text-xl font-black text-slate-900">{pendingCount}</Text>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      Pending
                    </Text>
                  </View>
                  <View className="w-[1px] h-8 bg-slate-100" />
                  <View className="flex-1 items-center">
                    <CheckCircle2 size={16} stroke="#10B981" className="mb-1" />
                    <Text className="text-xl font-black text-slate-900">{completedCount}</Text>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      Done
                    </Text>
                  </View>
                  <View className="w-[1px] h-8 bg-slate-100" />
                  <View className="flex-1 items-center">
                    <AlertCircle size={16} stroke="#EF4444" className="mb-1" />
                    <Text className="text-xl font-black text-slate-900">{urgentCount}</Text>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                      Urgent
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Quick Actions Shortcuts */}
              <Animated.View
                entering={FadeInDown.duration(400).springify()}
                className="py-6 border-b border-slate-100"
              >
                <Text className="text-slate-900 text-[14px] font-extrabold tracking-tight mb-4">
                  Quick Shortcuts
                </Text>
                <View className="flex-row items-center justify-between">
                  <ShortcutCard
                    icon={Plus}
                    label="Add Item"
                    onPress={() => navigation.navigate(ROUTES.ADD_ITEM)}
                    iconBgColor="bg-emerald-50"
                    iconColor="#059669"
                  />
                  <ShortcutCard
                    icon={Sparkles}
                    label="Recipe AI"
                    onPress={() => navigation.navigate(ROUTES.RECIPE_PACKS)}
                    iconBgColor="bg-purple-50"
                    iconColor="#7C3AED"
                  />
                  <ShortcutCard
                    icon={Users}
                    label="Family"
                    onPress={() => (navigation as any).navigate(ROUTES.FAMILY)}
                    iconBgColor="bg-amber-50"
                    iconColor="#D97706"
                  />
                  <ShortcutCard
                    icon={Share2}
                    label="Invite"
                    onPress={handleShareInvite}
                    iconBgColor="bg-blue-50"
                    iconColor="#2563EB"
                  />
                </View>
              </Animated.View>

              {/* Priority Focus Section */}
              <Animated.View
                entering={FadeInDown.duration(450).springify()}
                className="py-6 border-b border-slate-100"
              >
                <Text className="text-slate-900 text-[14px] font-extrabold tracking-tight mb-3">
                  Priority Focus
                </Text>
                {nextItem ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => (navigation as any).navigate(ROUTES.GROCERIES)}
                  >
                    <View className="py-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                          Next Up
                        </Text>
                        <PriorityBadge priority={nextItem.priority} />
                      </View>
                      <Text className="text-slate-900 text-[16px] font-extrabold leading-tight">
                        {nextItem.name} —{" "}
                        <Text className="text-slate-500 font-medium text-xs">
                          {nextItem.category}
                        </Text>
                      </Text>
                      <View className="flex-row justify-between items-center mt-2">
                        <Text className="text-slate-400 text-[11px] font-medium">
                          Added by {nextItem.addedBy?.name || "Member"}
                        </Text>
                        <View className="flex-row items-center">
                          <Text className="text-emerald-600 text-[11px] font-bold mr-1">
                            Open List
                          </Text>
                          <ArrowRight size={13} stroke="#059669" />
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View className="py-3 flex-row items-center">
                    <CheckCircle2 size={18} stroke="#10B981" className="mr-2" />
                    <Text className="text-[13px] font-bold text-slate-800">
                      All caught up! No pending items.
                    </Text>
                  </View>
                )}
              </Animated.View>

              {/* 1-Click Meal Packs Banner (Fixed & Non-Clipped) */}
              <Animated.View
                entering={FadeInDown.duration(500).springify()}
                className="py-6 border-b border-slate-100"
              >
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate(ROUTES.RECIPE_PACKS)}
                  className="overflow-hidden rounded-2xl bg-emerald-800 p-5 shadow-xs"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="text-[17px] font-black text-white tracking-tight">
                        1-Click Meal Packs 🌮🍝
                      </Text>
                      <Text className="mt-1.5 text-[12px] font-medium text-emerald-100 leading-5">
                        Instant ingredients for Taco Night, Pasta, & Healthy Prep.
                      </Text>
                    </View>
                    <View className="h-9 px-3.5 rounded-xl bg-white items-center justify-center flex-row">
                      <Text className="text-[12px] font-extrabold text-emerald-900 mr-1">
                        Explore
                      </Text>
                      <ChevronRight size={15} stroke="#064E3B" />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Category Breakdown */}
              <Animated.View entering={FadeInDown.duration(550).springify()} className="py-6">
                <Text className="text-slate-900 text-[16px] font-extrabold tracking-tight mb-4">
                  Category Breakdown
                </Text>
                <View className="flex-row items-center">
                  <DonutChart
                    total={totalCount}
                    data={[
                      { value: completedCount, color: "#10B981" },
                      { value: Math.max(0, pendingCount - urgentCount), color: "#F59E0B" },
                      { value: urgentCount, color: "#EF4444" },
                    ]}
                    size={75}
                    strokeWidth={8}
                  />
                  <View className="ml-4 flex-1">
                    {categoryStats.map(([cat, count]) => (
                      <ProgressBar
                        key={cat}
                        label={cat}
                        progress={(count / (totalCount || 1)) * 100}
                        color={cat === "Beauty" ? "#10B981" : "#F59E0B"}
                        height={5}
                      />
                    ))}
                  </View>
                </View>
              </Animated.View>
            </>
          ) : (
            <View className="py-12 items-center">
              <View className="h-14 w-14 rounded-2xl bg-emerald-50 items-center justify-center mb-3">
                <UsersRound size={28} stroke="#059669" strokeWidth={1.5} />
              </View>
              <Text className="text-lg font-extrabold text-slate-900 text-center px-4 tracking-tight">
                Set Up Your Family Group
              </Text>
              <Text className="text-slate-500 text-center mt-1.5 mb-5 px-6 text-[12px] leading-5">
                Create or join a family group to unlock shared grocery list, members & meal packs.
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate(ROUTES.FAMILY_SETUP)}
                activeOpacity={0.85}
                className="w-[80%] rounded-xl bg-emerald-600 py-3 items-center"
              >
                <Text className="text-white font-bold text-[13px]">Continue Setup</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
