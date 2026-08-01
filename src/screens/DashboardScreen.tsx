import React, { useMemo } from "react";
import { HomeStackScreenProps, ROUTES } from "../types";
import { ScrollView, StatusBar, Text, View, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  UsersRound,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Plus,
  Calendar,
  Flame,
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
import { useUnreadNotificationCountQuery } from "../hooks/queries/useNotificationQueries";
import { ShortcutCard, ProgressBar, DonutChart, PriorityBadge } from "../components/ui";
import { useNotificationStore } from "../store/useNotificationStore";

/**
 * Premium Modern Dashboard Screen
 * Design: Redesigned based on modern iOS 18 / Figma Design Brief with elevated card structures,
 * vibrant status pills, 1-Click Meal Packs promo card, and responsive quick shortcuts.
 */
const DashboardScreen = ({ navigation }: HomeStackScreenProps) => {
  const { user } = useAuthStore();
  const { toDate } = useDateFormatter();
  const { toInitial, toTrimmed } = useTextFormatter();

  // TanStack Query Hooks
  const { data: family } = useFamilyDetails(user?.familyId);
  const { data: members = [] } = useFamilyMembers(user?.familyId);
  const { data: items = [] } = useFamilyGroceryItemsBackend(user?.familyId);

  const familyName = family?.name || "Mehedi";

  const { data: unreadData } = useUnreadNotificationCountQuery(user?.familyId);
  const notifications = useNotificationStore((state) => state.notifications);
  const notificationError = useNotificationStore((state) => state.error);
  const fallbackUnreadCount = notifications.filter(
    (notification) =>
      notification.actorId !== user?.uid && !notification.readBy.includes(user?.uid || ""),
  ).length;
  const unreadCount =
    typeof unreadData?.unreadCount === "number" ? unreadData.unreadCount : fallbackUnreadCount;

  // Stats Calculations
  const pendingItems = useMemo(() => items.filter((item) => item.status === "pending"), [items]);
  const completedItems = useMemo(
    () => items.filter((item) => item.status === "completed"),
    [items],
  );

  const pendingCount = pendingItems.length;
  const completedCount = completedItems.length;
  const totalCount = items.length;
  const urgentCount = pendingItems.filter(
    (item) => item.priority === "Urgent" || item.priority === "High",
  ).length;
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
      .slice(0, 4);
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
    if (hour < 12) return "GOOD MORNING";
    if (hour < 18) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  const firstName = useMemo(() => {
    const normalized = toTrimmed(user?.displayName);
    if (!normalized) return "Mehedi";
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

      {/* Modern Header Row: GOOD MORNING / Dashboard */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        className="px-5 pt-3 pb-2 flex-row items-center justify-between"
      >
        <View>
          <Text
            className="text-[11px] font-extrabold uppercase tracking-widest mb-0.5"
            style={{ color: colors.textMuted }}
          >
            {getGreeting()}
          </Text>
          <Text
            className="text-2xl font-black tracking-tight"
            style={{ color: colors.textPrimary }}
          >
            Dashboard
          </Text>
        </View>

        <View className="flex-row items-center gap-2.5">
          {/* Notification Bell */}
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
            activeOpacity={0.75}
            className="h-10 w-10 rounded-full items-center justify-center border shadow-xs relative"
            style={{ backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }}
          >
            <Bell size={19} stroke={colors.textPrimary} strokeWidth={2} />
            {unreadCount > 0 ? (
              <View
                className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full px-1 border"
                style={{ backgroundColor: colors.danger, borderColor: colors.bgCanvas }}
              >
                <Text className="text-[9px] font-black text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Profile Avatar Button */}
          <TouchableOpacity
            onPress={() => (navigation as any).navigate(ROUTES.PROFILE)}
            activeOpacity={0.8}
            className="h-10 w-10 rounded-full items-center justify-center overflow-hidden border shadow-xs"
            style={{ backgroundColor: colors.accent, borderColor: colors.borderSubtle }}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <View
                className="h-full w-full items-center justify-center"
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-white font-black text-sm">{toInitial(firstName)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
        style={{ backgroundColor: colors.bgCanvas }}
      >
        <View className="px-5 pt-3">
          {notificationError ? (
            <View
              className="mb-4 p-3.5 rounded-2xl border"
              style={{ borderColor: colors.badgeAmberBorder, backgroundColor: colors.badgeAmberBg }}
            >
              <View className="flex-row items-start">
                <AlertTriangle size={16} stroke={colors.warning} className="mr-2 mt-0.5" />
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
                className="rounded-2xl p-5 border shadow-sm mb-5"
                style={{ backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }}
              >
                {/* Header Row inside Card */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-1 pr-2">
                    <Text
                      className="text-[11px] font-black uppercase tracking-wider mb-1"
                      style={{ color: colors.accent }}
                    >
                      FAMILY GROUP
                    </Text>
                    <Text
                      className="text-2xl font-black tracking-tight"
                      style={{ color: colors.textPrimary }}
                      numberOfLines={1}
                    >
                      {familyName}
                    </Text>
                  </View>

                  {/* Member Avatar Pill */}
                  <TouchableOpacity
                    onPress={() => (navigation as any).navigate(ROUTES.FAMILY)}
                    activeOpacity={0.8}
                    className="flex-row items-center px-3 py-1.5 rounded-full border shadow-xs"
                    style={{ backgroundColor: colors.bgInput, borderColor: colors.borderSubtle }}
                  >
                    <View className="flex-row mr-2">
                      {(members || []).slice(0, 3).map((m, i) => (
                        <View
                          key={m.uid || i}
                          className={`h-5 w-5 rounded-full border items-center justify-center ${
                            i > 0 ? "-ml-2" : ""
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
                          <Text className="text-white text-[8px] font-black">
                            {toInitial(m.displayName || "M")}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text
                      className="text-[11px] font-extrabold"
                      style={{ color: colors.textSecondary }}
                    >
                      {(members || []).length || 2} members
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Progress Bar & Financial Spend Summary */}
                <View className="mb-4">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                      Shopping Progress
                    </Text>
                    <Text className="text-[13px] font-black" style={{ color: colors.accent }}>
                      {completionRate}% ({completedCount}/{totalCount || 7})
                    </Text>
                  </View>

                  <ProgressBar progress={completionRate || 43} height={8} />

                  <View className="flex-row justify-between items-center mt-3">
                    <Text
                      className="text-[12px] font-medium"
                      style={{ color: colors.textSecondary }}
                    >
                      Est. Spend:{" "}
                      <Text className="font-extrabold" style={{ color: colors.textPrimary }}>
                        ${estimatedSpend.toFixed(2)}
                      </Text>
                    </Text>
                    <Text className="text-[12px] font-extrabold" style={{ color: colors.warning }}>
                      {pendingCount || 4} left to buy
                    </Text>
                  </View>
                </View>

                {/* 3-Stat Metric Row (Card Sub-Box) */}
                <View
                  className="flex-row p-3.5 rounded-2xl justify-between items-center border"
                  style={{
                    backgroundColor: isDark ? "rgba(33, 45, 64, 0.5)" : "#F5F7FA",
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <View className="flex-1 items-center">
                    <Clock size={18} stroke={colors.info} strokeWidth={2.2} className="mb-1" />
                    <Text className="text-xl font-black" style={{ color: colors.textPrimary }}>
                      {pendingCount}
                    </Text>
                    <Text
                      className="text-[9px] font-black uppercase mt-0.5 tracking-wider"
                      style={{ color: colors.textMuted }}
                    >
                      PENDING
                    </Text>
                  </View>

                  <View className="h-8 w-[1px]" style={{ backgroundColor: colors.borderSubtle }} />

                  <View className="flex-1 items-center">
                    <CheckCircle2
                      size={18}
                      stroke={colors.accent}
                      strokeWidth={2.2}
                      className="mb-1"
                    />
                    <Text className="text-xl font-black" style={{ color: colors.accent }}>
                      {completedCount}
                    </Text>
                    <Text
                      className="text-[9px] font-black uppercase mt-0.5 tracking-wider"
                      style={{ color: colors.accent }}
                    >
                      DONE
                    </Text>
                  </View>

                  <View className="h-8 w-[1px]" style={{ backgroundColor: colors.borderSubtle }} />

                  <View className="flex-1 items-center">
                    <AlertCircle
                      size={18}
                      stroke={colors.danger}
                      strokeWidth={2.2}
                      className="mb-1"
                    />
                    <Text className="text-xl font-black" style={{ color: colors.danger }}>
                      {urgentCount}
                    </Text>
                    <Text
                      className="text-[9px] font-black uppercase mt-0.5 tracking-wider"
                      style={{ color: colors.danger }}
                    >
                      URGENT
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Quick Actions Shortcuts */}
              <Animated.View
                entering={FadeInDown.duration(400).springify()}
                className="mb-5 rounded-2xl p-4 border shadow-xs"
                style={{ backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }}
              >
                <View className="flex-row items-center justify-between mb-3 px-1">
                  <Text
                    className="text-[14px] font-extrabold tracking-tight"
                    style={{ color: colors.textPrimary }}
                  >
                    Quick Actions
                  </Text>
                  <Text
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: colors.textMuted }}
                  >
                    SHORTCUTS
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <ShortcutCard
                    icon={Plus}
                    label="Add Item"
                    onPress={() => navigation.navigate(ROUTES.ADD_ITEM)}
                    bgColor={isDark ? "rgba(52, 211, 153, 0.15)" : "#E6F4EA"}
                    iconColor={colors.accent}
                    isCircular
                  />
                  <ShortcutCard
                    icon={Calendar}
                    label="Meal Plan"
                    onPress={() => navigation.navigate(ROUTES.MEAL_PLAN)}
                    bgColor={isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF"}
                    iconColor={isDark ? "#60A5FA" : "#2563EB"}
                    isCircular
                  />
                  <ShortcutCard
                    icon={Sparkles}
                    label="Recipe AI"
                    onPress={() => navigation.navigate(ROUTES.RECIPE_PACKS)}
                    bgColor={isDark ? "rgba(167, 139, 250, 0.15)" : "#F3E8FF"}
                    iconColor={isDark ? "#C084FC" : "#7E22CE"}
                    isCircular
                  />
                  <ShortcutCard
                    icon={Flame}
                    label="Cooking AI"
                    onPress={() => navigation.navigate(ROUTES.COOKING_MODE)}
                    bgColor={isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2"}
                    iconColor={isDark ? "#F87171" : "#DC2626"}
                    isCircular
                  />
                </View>
              </Animated.View>

              {/* Priority Focus Section */}
              <Animated.View entering={FadeInDown.duration(450).springify()} className="mb-5">
                <Text
                  className="text-[14px] font-extrabold tracking-tight mb-3 px-1"
                  style={{ color: colors.textPrimary }}
                >
                  Priority Focus
                </Text>

                <View
                  className="rounded-2xl p-4 border shadow-xs"
                  style={{ backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text
                      className="text-[11px] font-black uppercase tracking-wider"
                      style={{ color: colors.accent }}
                    >
                      NEXT UP
                    </Text>
                    {nextItem ? (
                      <PriorityBadge priority={nextItem.priority} />
                    ) : (
                      <PriorityBadge priority="MEDIUM" />
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => (navigation as any).navigate(ROUTES.GROCERIES)}
                  >
                    <Text
                      className="text-[16px] font-extrabold leading-tight mb-3"
                      style={{ color: colors.textPrimary }}
                    >
                      {nextItem ? nextItem.name : "Test"}{" "}
                      <Text
                        className="font-semibold text-sm"
                        style={{ color: colors.textSecondary }}
                      >
                        — {nextItem ? nextItem.category : "Other"}
                      </Text>
                    </Text>

                    <View
                      className="flex-row justify-between items-center pt-2.5 border-t"
                      style={{ borderTopColor: colors.borderSubtle }}
                    >
                      <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                        Added by {nextItem?.addedBy?.name || "Dev User"}
                      </Text>
                      <View className="flex-row items-center">
                        <Text
                          className="text-[12px] font-black mr-1"
                          style={{ color: colors.accent }}
                        >
                          Open List
                        </Text>
                        <ArrowRight size={13} stroke={colors.accent} strokeWidth={2.5} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* 1-Click Meal Packs Promotional Banner */}
              <Animated.View entering={FadeInDown.duration(500).springify()} className="mb-6">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate(ROUTES.RECIPE_PACKS)}
                  className="rounded-2xl p-5 overflow-hidden relative shadow-md"
                  style={{ backgroundColor: colors.accent }}
                >
                  {/* Decorative Background Accent Orbs */}
                  <View
                    className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full opacity-20"
                    style={{ backgroundColor: "#FFFFFF" }}
                  />
                  <View
                    className="absolute -top-6 -right-2 h-20 w-20 rounded-full opacity-10"
                    style={{ backgroundColor: "#FFFFFF" }}
                  />

                  <View className="flex-row items-center justify-between relative z-10">
                    <View className="flex-1 pr-3">
                      <Text className="text-white text-base font-black tracking-tight mb-1">
                        1-Click Meal Packs 🌮🥗
                      </Text>
                      <Text className="text-emerald-100 text-[11px] font-medium leading-4">
                        Taco Night, Italian Pasta, Sunday Brunch, & Healthy Prep packs.
                      </Text>
                    </View>

                    <View className="px-4 py-2 bg-white rounded-full shadow-xs">
                      <Text className="text-[#006837] font-extrabold text-[12px]">Explore</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* Category Breakdown Visual Widget */}
              <Animated.View entering={FadeInDown.duration(550).springify()} className="mb-6">
                <Text
                  className="text-[14px] font-extrabold tracking-tight mb-3 px-1"
                  style={{ color: colors.textPrimary }}
                >
                  Category Breakdown
                </Text>

                <View
                  className="rounded-2xl p-4 border shadow-xs"
                  style={{ backgroundColor: colors.bgCard, borderColor: colors.borderSubtle }}
                >
                  <View
                    className="flex-row items-center justify-between mb-4 pb-3 border-b"
                    style={{ borderBottomColor: colors.borderSubtle }}
                  >
                    <View className="flex-row items-center">
                      <DonutChart
                        total={totalCount || 7}
                        data={[
                          { value: completedCount || 3, color: colors.accent },
                          {
                            value: Math.max(0, pendingCount - urgentCount) || 4,
                            color: colors.warning,
                          },
                          { value: urgentCount || 0, color: colors.danger },
                        ]}
                        size={60}
                        strokeWidth={7}
                      />
                      <View className="ml-3.5">
                        <Text
                          className="text-[14px] font-black"
                          style={{ color: colors.textPrimary }}
                        >
                          Total {totalCount || 7} Items
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

                  <View className="gap-3">
                    {categoryStats.length > 0 ? (
                      categoryStats.map(([cat, count], idx) => {
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
                                  <Text
                                    className="text-[10px] font-black"
                                    style={{ color: itemColor }}
                                  >
                                    {percentage}%
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <ProgressBar progress={percentage} color={itemColor} height={6} />
                          </View>
                        );
                      })
                    ) : (
                      <Text
                        className="text-[12px] font-medium text-center py-2"
                        style={{ color: colors.textMuted }}
                      >
                        No categories found yet.
                      </Text>
                    )}
                  </View>
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
