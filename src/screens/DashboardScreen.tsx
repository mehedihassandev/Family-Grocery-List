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
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  useFamilyDetails,
  useFamilyMembers,
  useFamilyGroceryItemsBackend,
  useDateFormatter,
  useTextFormatter,
  useAppTheme,
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

  const { isDark, colors } = useAppTheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: colors.bgCanvas }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header Row with Sleek Avatar Ring & Unread Bell */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        className="px-6 py-3.5 flex-row items-center justify-between border-b"
        style={{ borderBottomColor: colors.borderSubtle }}
      >
        <View className="flex-row items-center">
          <View
            className="h-11 w-11 rounded-full items-center justify-center overflow-hidden border-2"
            style={{ borderColor: colors.accent }}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <View
                className="h-full w-full items-center justify-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-black text-base">{toInitial(firstName)}</Text>
              </View>
            )}
          </View>
          <View className="ml-3">
            <View className="flex-row items-center">
              <Text
                className="text-[11px] font-bold uppercase tracking-wider mr-1.5"
                style={{ color: colors.accent }}
              >
                {getGreeting()}
              </Text>
              <Text
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: colors.accentLightSubtle, color: colors.accent }}
              >
                Online
              </Text>
            </View>
            <Text
              className="text-[18px] font-black tracking-tight"
              style={{ color: colors.textPrimary }}
            >
              {user?.displayName || firstName} 👋
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
          activeOpacity={0.75}
          className="h-10 w-10 rounded-xl items-center justify-center border shadow-xs relative"
          style={{ backgroundColor: colors.bgSurface, borderColor: colors.border }}
        >
          <Bell size={18} stroke={colors.accent} strokeWidth={2} />
          {unreadCount > 0 ? (
            <View
              className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full px-1 border"
              style={{ backgroundColor: colors.danger, borderColor: colors.bgCanvas }}
            >
              <Text className="text-[9px] font-black text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
        style={{ backgroundColor: colors.bgCanvas }}
      >
        <View className="px-6 pt-4">
          {notificationError ? (
            <View
              className="mb-4 p-3.5 rounded-2xl border"
              style={{ borderColor: colors.badgeAmberBorder, backgroundColor: colors.badgeAmberBg }}
            >
              <View className="flex-row items-start">
                <AlertTriangle size={16} stroke={colors.warning} className="mr-2" />
                <Text
                  className="flex-1 text-[12px] font-medium leading-4"
                  style={{ color: colors.badgeAmberText }}
                >
                  Live activity feed issue: {notificationError}
                </Text>
              </View>
            </View>
          ) : null}

          {user?.familyId ? (
            <>
              {/* Ultra-Aesthetic Hero Family Group Card */}
              <Animated.View
                entering={FadeInDown.duration(350).springify()}
                className="rounded-xl p-5 border shadow-sm mb-6"
                style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center mb-1">
                      <View
                        className="px-2 py-0.5 rounded-full flex-row items-center mr-1.5"
                        style={{ backgroundColor: colors.accentLightSubtle }}
                      >
                        <Users size={11} stroke={colors.accent} style={{ marginRight: 4 }} />
                        <Text
                          className="text-[10px] font-black uppercase tracking-wider"
                          style={{ color: colors.accent }}
                        >
                          FAMILY HUB
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="text-2xl font-black tracking-tight"
                      style={{ color: colors.textPrimary }}
                      numberOfLines={1}
                    >
                      {familyName}
                    </Text>
                  </View>

                  <View
                    className="flex-row items-center px-3 py-1.5 rounded-full border shadow-xs"
                    style={{ backgroundColor: colors.bgInput, borderColor: colors.borderSubtle }}
                  >
                    <View className="flex-row mr-2">
                      {(members || []).slice(0, 3).map((m, i) => (
                        <View
                          key={m.uid}
                          className={`h-6 w-6 rounded-full border items-center justify-center ${
                            i > 0 ? "-ml-2.5" : ""
                          }`}
                          style={{
                            backgroundColor:
                              i === 0
                                ? colors.accent
                                : i === 1
                                  ? colors.info
                                  : colors.badgePurpleText,
                            borderColor: colors.bgCard,
                          }}
                        >
                          <Text className="text-white text-[9px] font-extrabold">
                            {toInitial(m.displayName)}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text
                      className="text-[11px] font-extrabold"
                      style={{ color: colors.textSecondary }}
                    >
                      {(members || []).length} Member{(members || []).length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar & Financial Spend Summary */}
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                      Shopping Progress
                    </Text>
                    <Text className="text-[13px] font-black" style={{ color: colors.accent }}>
                      {completionRate}% ({completedCount}/{totalCount})
                    </Text>
                  </View>
                  <ProgressBar progress={completionRate} height={7} />
                  <View className="flex-row justify-between items-center mt-2.5">
                    <View
                      className="flex-row items-center px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: colors.bgInput }}
                    >
                      <Text
                        className="text-[11px] font-semibold"
                        style={{ color: colors.textSecondary }}
                      >
                        Est. Spend:{" "}
                        <Text className="font-extrabold" style={{ color: colors.textPrimary }}>
                          ৳{estimatedSpend.toFixed(0)}
                        </Text>
                      </Text>
                    </View>
                    <Text className="text-[12px] font-bold" style={{ color: colors.accent }}>
                      {pendingCount} left to buy
                    </Text>
                  </View>
                </View>

                {/* 3-Stat Metric Row (Flat, No Sub-Cards) */}
                <View
                  className="flex-row pt-3 justify-between items-center border-t"
                  style={{ borderTopColor: colors.borderSubtle }}
                >
                  <View className="flex-1 items-center py-1">
                    <Clock size={16} stroke={colors.icon} className="mb-1" />
                    <Text className="text-lg font-black" style={{ color: colors.textPrimary }}>
                      {pendingCount}
                    </Text>
                    <Text
                      className="text-[10px] font-bold uppercase mt-0.5"
                      style={{ color: colors.textMuted }}
                    >
                      Pending
                    </Text>
                  </View>
                  <View className="flex-1 items-center py-1">
                    <CheckCircle2 size={16} stroke={colors.accent} className="mb-1" />
                    <Text className="text-lg font-black" style={{ color: colors.accent }}>
                      {completedCount}
                    </Text>
                    <Text
                      className="text-[10px] font-bold uppercase mt-0.5"
                      style={{ color: colors.accent }}
                    >
                      Done
                    </Text>
                  </View>
                  <View className="flex-1 items-center py-1">
                    <AlertCircle size={16} stroke={colors.danger} className="mb-1" />
                    <Text className="text-lg font-black" style={{ color: colors.danger }}>
                      {urgentCount}
                    </Text>
                    <Text
                      className="text-[10px] font-bold uppercase mt-0.5"
                      style={{ color: colors.danger }}
                    >
                      Urgent
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Quick Actions Shortcuts with Unified Theme Color */}
              <Animated.View entering={FadeInDown.duration(400).springify()} className="mb-6">
                <Text
                  className="text-[14px] font-extrabold tracking-tight mb-3"
                  style={{ color: colors.textPrimary }}
                >
                  Quick Shortcuts
                </Text>
                <View className="flex-row items-center justify-between">
                  <ShortcutCard
                    icon={Plus}
                    label="Add Item"
                    onPress={() => navigation.navigate(ROUTES.ADD_ITEM)}
                    bgColor={colors.accentLightSubtle}
                    iconColor={colors.accent}
                  />
                  <ShortcutCard
                    icon={Sparkles}
                    label="Recipe AI"
                    onPress={() => navigation.navigate(ROUTES.RECIPE_PACKS)}
                    bgColor={colors.accentLightSubtle}
                    iconColor={colors.accent}
                  />
                  <ShortcutCard
                    icon={Users}
                    label="Family"
                    onPress={() => (navigation as any).navigate(ROUTES.FAMILY)}
                    bgColor={colors.accentLightSubtle}
                    iconColor={colors.accent}
                  />
                  <ShortcutCard
                    icon={Share2}
                    label="Invite"
                    onPress={handleShareInvite}
                    bgColor={colors.accentLightSubtle}
                    iconColor={colors.accent}
                  />
                </View>
              </Animated.View>

              {/* Priority Focus Section (Sleek Aesthetic Highlight Card) */}
              <Animated.View
                entering={FadeInDown.duration(450).springify()}
                className="mb-6 rounded-xl p-4 border-l-4 border"
                style={{
                  backgroundColor: colors.bgInput,
                  borderColor: colors.borderSubtle,
                  borderLeftColor: colors.accent,
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    className="text-[11px] font-black uppercase tracking-wider"
                    style={{ color: colors.accent }}
                  >
                    PRIORITY FOCUS
                  </Text>
                  {nextItem ? <PriorityBadge priority={nextItem.priority} /> : null}
                </View>

                {nextItem ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => (navigation as any).navigate(ROUTES.GROCERIES)}
                  >
                    <Text
                      className="text-[16px] font-extrabold leading-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      {nextItem.name}{" "}
                      <Text
                        className="font-semibold text-xs"
                        style={{ color: colors.textSecondary }}
                      >
                        ({nextItem.category})
                      </Text>
                    </Text>
                    <View
                      className="flex-row justify-between items-center mt-2.5 pt-2 border-t"
                      style={{ borderTopColor: colors.borderSubtle }}
                    >
                      <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                        Added by {nextItem.addedBy?.name || "Member"}
                      </Text>
                      <View
                        className="flex-row items-center px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: colors.accentLightSubtle }}
                      >
                        <Text
                          className="text-[11px] font-black mr-1"
                          style={{ color: colors.accent }}
                        >
                          View List
                        </Text>
                        <ArrowRight size={12} stroke={colors.accent} strokeWidth={2.5} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View className="py-2 flex-row items-center">
                    <CheckCircle2 size={18} stroke={colors.accent} className="mr-2" />
                    <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                      All caught up! No pending items.
                    </Text>
                  </View>
                )}
              </Animated.View>

              {/* Category Breakdown Visual Widget */}
              <Animated.View entering={FadeInDown.duration(550).springify()} className="mb-6">
                <Text
                  className="text-[14px] font-extrabold tracking-tight mb-3"
                  style={{ color: colors.textPrimary }}
                >
                  Category Breakdown
                </Text>

                <View
                  className="flex-row items-center justify-between mb-4 pb-3 border-b"
                  style={{ borderBottomColor: colors.borderSubtle }}
                >
                  <View className="flex-row items-center">
                    <DonutChart
                      total={totalCount}
                      data={[
                        { value: completedCount, color: colors.accent },
                        { value: Math.max(0, pendingCount - urgentCount), color: colors.warning },
                        { value: urgentCount, color: colors.danger },
                      ]}
                      size={64}
                      strokeWidth={7}
                    />
                    <View className="ml-3.5">
                      <Text
                        className="text-[14px] font-black"
                        style={{ color: colors.textPrimary }}
                      >
                        Total {totalCount} Items
                      </Text>
                      <Text
                        className="text-[11px] font-medium mt-0.5"
                        style={{ color: colors.textMuted }}
                      >
                        {completedCount} bought · {pendingCount} remaining
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="gap-3.5">
                  {categoryStats.map(([cat, count], idx) => {
                    const categoryColors = [
                      colors.accent,
                      colors.badgePurpleText,
                      colors.info,
                      colors.warning,
                      colors.danger,
                    ];
                    const itemColor = categoryColors[idx % categoryColors.length];
                    const percentage = Math.round((count / (totalCount || 1)) * 100);

                    return (
                      <View key={cat} className="gap-1.5">
                        <View className="flex-row justify-between items-center">
                          <View className="flex-row items-center">
                            <View
                              className="h-2.5 w-2.5 rounded-full mr-2"
                              style={{ backgroundColor: itemColor }}
                            />
                            <Text
                              className="text-[12px] font-extrabold"
                              style={{ color: colors.textPrimary }}
                            >
                              {cat}
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-1.5">
                            <Text
                              className="text-[11px] font-bold"
                              style={{ color: colors.textSecondary }}
                            >
                              {count} item{count !== 1 ? "s" : ""}
                            </Text>
                            <View
                              className="px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: colors.bgInput }}
                            >
                              <Text className="text-[10px] font-black" style={{ color: itemColor }}>
                                {percentage}%
                              </Text>
                            </View>
                          </View>
                        </View>
                        <ProgressBar progress={percentage} color={itemColor} height={6} />
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            </>
          ) : (
            <View className="py-12 items-center">
              <View
                className="h-14 w-14 rounded-2xl items-center justify-center mb-3"
                style={{ backgroundColor: colors.accentLightSubtle }}
              >
                <UsersRound size={28} stroke={colors.accent} strokeWidth={1.5} />
              </View>
              <Text
                className="text-lg font-extrabold text-center px-4 tracking-tight"
                style={{ color: colors.textPrimary }}
              >
                Set Up Your Family Group
              </Text>
              <Text
                className="text-center mt-1.5 mb-5 px-6 text-[12px] leading-5"
                style={{ color: colors.textSecondary }}
              >
                Create or join a family group to unlock shared grocery list, members & meal packs.
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate(ROUTES.FAMILY_SETUP)}
                activeOpacity={0.85}
                className="w-[80%] rounded-xl py-3 items-center"
                style={{ backgroundColor: colors.accent }}
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
