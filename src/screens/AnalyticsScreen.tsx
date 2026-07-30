import React, { useMemo, useState } from "react";
import { AnalyticsStackScreenProps, ROUTES } from "../types";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Calendar as CalendarIcon,
  AlertTriangle,
  Store,
  Wallet,
  Bell,
  RefreshCw,
  Trash2,
  Split,
  ShoppingBag,
  PieChart,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  useFamilyGroceryItemsBackend,
  useDateFormatter,
  useMonthlyAnalytics,
  useBasketOptimization,
  useBasketSplitOptimization,
  usePriceAlerts,
  useCheckPriceAlerts,
  useDeletePriceAlert,
  useAppTheme,
} from "../hooks";
import { AppHeader, DonutChart, ProgressBar } from "../components/ui";

const getDataErrorMessage = (error: Error) => {
  const message = error.message || "";
  if (message.includes("status 500")) {
    return "Backend server error (500). Please check backend deployment.";
  }
  if (message.includes("401") || message.includes("403")) {
    return "Authentication failed. Please sign in again.";
  }
  return message || "Could not load analytics. Check internet and retry.";
};

type TimeframeMode = "month" | "quarter" | "year";

/**
 * Cardless Analytics & Financial Intelligence Screen
 * Why: Pure white canvas, zero boxed cards, strong typography and hairline dividers.
 */
const AnalyticsScreen = ({ navigation }: AnalyticsStackScreenProps) => {
  const { user } = useAuthStore();
  const { toDate, toMonthYear } = useDateFormatter();
  const [timeframe, setTimeframe] = useState<TimeframeMode>("month");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // TanStack Query Hooks for Python Backend API
  const { data: items = [], error: analyticsError } = useFamilyGroceryItemsBackend(user?.familyId);
  const analyticsErrorMessage = analyticsError
    ? getDataErrorMessage(analyticsError as Error)
    : null;

  // Monthly Analytics & Superstore Basket Optimizer Hooks
  const { data: monthlyAnalytics } = useMonthlyAnalytics(
    user?.familyId || undefined,
    items,
    selectedMonth,
  );
  const { data: basketOpt } = useBasketOptimization(user?.familyId || undefined, items);
  const { data: basketSplitOpt } = useBasketSplitOptimization(user?.familyId || undefined, items);
  const { data: priceAlerts = [] } = usePriceAlerts(user?.familyId || undefined);
  const checkAlertsMutation = useCheckPriceAlerts(user?.familyId || undefined);
  const deleteAlertMutation = useDeletePriceAlert(user?.familyId || undefined);

  // Filtering items based on selected month & timeframe
  const filteredTimeframeItems = useMemo(() => {
    return items.filter((item) => {
      const date = toDate(item.createdAt);
      if (!date) return false;

      if (timeframe === "month") {
        return (
          date.getMonth() === selectedMonth.getMonth() &&
          date.getFullYear() === selectedMonth.getFullYear()
        );
      }

      if (timeframe === "quarter") {
        const now = selectedMonth;
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return date >= threeMonthsAgo && date <= new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      if (timeframe === "year") {
        return date.getFullYear() === selectedMonth.getFullYear();
      }

      return true;
    });
  }, [items, selectedMonth, timeframe, toDate]);

  const summary = useMemo(() => {
    const total = filteredTimeframeItems.length;
    const completed = filteredTimeframeItems.filter((i) => i.status === "completed").length;
    const pending = filteredTimeframeItems.filter((i) => i.status === "pending").length;
    const urgent = filteredTimeframeItems.filter(
      (i) => i.status === "pending" && i.priority === "Urgent",
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, urgent, completionRate };
  }, [filteredTimeframeItems]);

  const monthlyEstimatedSpend = useMemo(() => {
    return filteredTimeframeItems.reduce((sum, item) => {
      if (typeof item.estimatedTotal === "number" && Number.isFinite(item.estimatedTotal)) {
        return sum + item.estimatedTotal;
      }
      if (typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice)) {
        return sum + item.unitPrice;
      }
      return sum;
    }, 0);
  }, [filteredTimeframeItems]);

  const previousMonth = useMemo(
    () => new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1),
    [selectedMonth],
  );

  const previousMonthItems = useMemo(() => {
    return items.filter((item) => {
      const date = toDate(item.createdAt);
      if (!date) return false;
      return (
        date.getMonth() === previousMonth.getMonth() &&
        date.getFullYear() === previousMonth.getFullYear()
      );
    });
  }, [items, previousMonth, toDate]);

  const previousSummary = useMemo(() => {
    const total = previousMonthItems.length;
    const completed = previousMonthItems.filter((i) => i.status === "completed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completionRate };
  }, [previousMonthItems]);

  const insights = useMemo(() => {
    const itemDelta = summary.total - previousSummary.total;
    const completionDelta = summary.completionRate - previousSummary.completionRate;
    return { itemDelta, completionDelta };
  }, [
    previousSummary.completionRate,
    previousSummary.total,
    summary.completionRate,
    summary.total,
  ]);

  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredTimeframeItems.forEach((item) => {
      stats[item.category] = (stats[item.category] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [filteredTimeframeItems]);

  const topPurchasedItems = useMemo(() => {
    const frequencyMap: Record<string, { count: number; category: string; estCost: number }> = {};

    filteredTimeframeItems.forEach((item) => {
      const key = item.name.trim().toLowerCase();
      const cost =
        typeof item.estimatedTotal === "number"
          ? item.estimatedTotal
          : typeof item.unitPrice === "number"
            ? item.unitPrice
            : 0;

      if (!frequencyMap[key]) {
        frequencyMap[key] = { count: 0, category: item.category, estCost: 0 };
      }
      frequencyMap[key].count += 1;
      frequencyMap[key].estCost += cost;
      frequencyMap[key].category = item.category || frequencyMap[key].category;
    });

    return Object.entries(frequencyMap)
      .map(([nameKey, data]) => ({
        name: nameKey.charAt(0).toUpperCase() + nameKey.slice(1),
        count: data.count,
        category: data.category,
        estCost: data.estCost,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredTimeframeItems]);

  const shoppingVelocity = useMemo(() => {
    const urgentItemsCount = filteredTimeframeItems.filter((i) => i.priority === "Urgent").length;
    const urgentCompletedCount = filteredTimeframeItems.filter(
      (i) => i.priority === "Urgent" && i.status === "completed",
    ).length;
    const urgentResolutionRate =
      urgentItemsCount > 0 ? Math.round((urgentCompletedCount / urgentItemsCount) * 100) : 100;

    const itemsPerWeek = (summary.total / 4).toFixed(1);

    return {
      urgentResolutionRate,
      itemsPerWeek,
      completedPercentage: summary.completionRate,
    };
  }, [filteredTimeframeItems, summary.completionRate, summary.total]);

  const changeMonth = (offset: number) => {
    setSelectedMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + offset);
      return next;
    });
  };

  const { isDark, colors } = useAppTheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: colors.bgCanvas }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader
        title="Analytics"
        eyebrow="Financial & Shopping Intelligence"
        onNotificationPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="flex-1"
        style={{ backgroundColor: colors.bgCanvas }}
      >
        {/* Sleek Top Control Bar: Date Selector + Segmented Pills */}
        <Animated.View entering={FadeInDown.duration(250).springify()} className="px-6 pt-3 pb-2">
          <View className="flex-row items-center justify-between">
            {/* Month Navigator */}
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={8} className="pr-1.5 py-1">
                <ChevronLeft size={20} stroke={colors.icon} />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <CalendarIcon size={14} stroke={colors.accent} style={{ marginRight: 5 }} />
                <Text
                  className="text-[15px] font-black tracking-tight"
                  style={{ color: colors.textPrimary }}
                >
                  {toMonthYear(selectedMonth)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => changeMonth(1)} hitSlop={8} className="pl-1.5 py-1">
                <ChevronRight size={20} stroke={colors.icon} />
              </TouchableOpacity>
            </View>

            {/* Timeframe Segment Toggle */}
            <View
              className="flex-row p-1 rounded-full border"
              style={{ backgroundColor: colors.bgInput, borderColor: colors.borderSubtle }}
            >
              <TouchableOpacity
                onPress={() => setTimeframe("month")}
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: timeframe === "month" ? colors.accent : "transparent" }}
              >
                <Text
                  className="text-[11px] font-extrabold"
                  style={{ color: timeframe === "month" ? colors.white : colors.textSecondary }}
                >
                  Month
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTimeframe("quarter")}
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: timeframe === "quarter" ? colors.accent : "transparent" }}
              >
                <Text
                  className="text-[11px] font-extrabold"
                  style={{ color: timeframe === "quarter" ? colors.white : colors.textSecondary }}
                >
                  3M
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTimeframe("year")}
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: timeframe === "year" ? colors.accent : "transparent" }}
              >
                <Text
                  className="text-[11px] font-extrabold"
                  style={{ color: timeframe === "year" ? colors.white : colors.textSecondary }}
                >
                  Year
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {analyticsErrorMessage ? (
          <View
            className="mx-6 mt-3 p-3 rounded-xl border"
            style={{ backgroundColor: colors.badgeAmberBg, borderColor: colors.badgeAmberBorder }}
          >
            <View className="flex-row items-start">
              <AlertTriangle size={15} stroke={colors.warning} />
              <Text
                className="ml-2 flex-1 text-[12px] font-medium leading-5"
                style={{ color: colors.badgeAmberText }}
              >
                {analyticsErrorMessage}
              </Text>
            </View>
          </View>
        ) : null}

        {filteredTimeframeItems.length > 0 ? (
          <View className="px-6 pt-3">
            {/* HERO STAT OVERVIEW */}
            <Animated.View
              entering={FadeInDown.duration(300).springify()}
              className="pb-5 border-b"
              style={{ borderBottomColor: colors.borderSubtle }}
            >
              <Text
                className="text-[11px] font-bold uppercase tracking-wider mb-1"
                style={{ color: colors.textMuted }}
              >
                Estimated Spend • {toMonthYear(selectedMonth)}
              </Text>
              <View className="flex-row items-baseline justify-between">
                <Text
                  className="text-3xl font-black tracking-tight"
                  style={{ color: colors.accent }}
                >
                  ৳
                  {monthlyEstimatedSpend > 0
                    ? monthlyEstimatedSpend
                    : monthlyAnalytics?.totalSpentBDT || 0}
                </Text>

                {/* Trend Badge */}
                <View
                  className="flex-row items-center px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: colors.accentLightSubtle }}
                >
                  <TrendingUp
                    size={13}
                    stroke={insights.itemDelta >= 0 ? colors.accent : colors.danger}
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-[11px] font-extrabold" style={{ color: colors.accent }}>
                    {insights.itemDelta >= 0 ? "+" : ""}
                    {insights.itemDelta} items vs {toMonthYear(previousMonth)}
                  </Text>
                </View>
              </View>

              <Text
                className="text-[12px] font-medium mt-1"
                style={{ color: colors.textSecondary }}
              >
                {summary.total} total items across {categoryData.length} categories
              </Text>
            </Animated.View>

            {/* STATUS BREAKDOWN & DONUT CHART (Flat Side-by-Side) */}
            <Animated.View
              entering={FadeInDown.duration(350).springify()}
              className="py-5 border-b"
              style={{ borderBottomColor: colors.borderSubtle }}
            >
              <Text
                className="text-[13px] font-bold uppercase tracking-wider mb-4"
                style={{ color: colors.textMuted }}
              >
                Completion & Velocity
              </Text>

              <View className="flex-row items-center justify-between">
                {/* Donut Chart */}
                <View className="items-center justify-center">
                  <DonutChart
                    total={summary.total}
                    data={[
                      { value: summary.completed, color: colors.accent },
                      {
                        value: Math.max(0, summary.pending - summary.urgent),
                        color: colors.warning,
                      },
                      { value: summary.urgent, color: colors.danger },
                    ]}
                    size={115}
                    strokeWidth={10}
                  />
                </View>

                {/* Flat Legend Column */}
                <View className="flex-1 ml-6 space-y-2.5">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-2" />
                      <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                        Done
                      </Text>
                    </View>
                    <Text className="text-[13px] font-black" style={{ color: colors.textPrimary }}>
                      {summary.completed}{" "}
                      <Text className="text-[11px] font-normal" style={{ color: colors.textMuted }}>
                        ({summary.completionRate}%)
                      </Text>
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="h-2.5 w-2.5 rounded-full bg-amber-500 mr-2" />
                      <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                        Pending
                      </Text>
                    </View>
                    <Text className="text-[13px] font-black" style={{ color: colors.textPrimary }}>
                      {summary.pending}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="h-2.5 w-2.5 rounded-full bg-rose-500 mr-2" />
                      <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                        Urgent
                      </Text>
                    </View>
                    <Text
                      className="text-[13px] font-black"
                      style={{ color: summary.urgent > 0 ? colors.danger : colors.textPrimary }}
                    >
                      {summary.urgent}
                    </Text>
                  </View>

                  <View
                    className="pt-1.5 border-t flex-row items-center justify-between"
                    style={{ borderTopColor: colors.borderSubtle }}
                  >
                    <Text className="text-[11px] font-semibold" style={{ color: colors.textMuted }}>
                      Urgent Cleared
                    </Text>
                    <Text className="text-[12px] font-extrabold" style={{ color: colors.accent }}>
                      {shoppingVelocity.urgentResolutionRate}%
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* SUPERSTORE BASKET OPTIMIZER */}
            {Boolean(basketOpt && Array.isArray(basketOpt.storeTotals)) && (
              <Animated.View
                entering={FadeInDown.duration(400).springify()}
                className="py-5 border-b"
                style={{ borderBottomColor: colors.borderSubtle }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Store size={15} color={colors.accent} style={{ marginRight: 6 }} />
                    <Text
                      className="text-[14px] font-extrabold tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Superstore Price Comparison
                    </Text>
                  </View>
                  <Text className="font-bold text-xs" style={{ color: colors.accent }}>
                    Best: {basketOpt?.cheapestStoreName || "Store"}
                  </Text>
                </View>

                {basketOpt?.storeTotals?.map((st, i) => (
                  <View
                    key={st.storeName || i}
                    className="flex-row items-center justify-between py-2 border-b last:border-b-0"
                    style={{ borderColor: colors.borderSubtle }}
                  >
                    <View className="flex-row items-center">
                      <Text
                        className="font-bold text-xs mr-2"
                        style={{ color: colors.textPrimary }}
                      >
                        {st.storeName}
                      </Text>
                      {st.storeName === basketOpt?.cheapestStoreName && (
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: colors.accentLightSubtle }}
                        >
                          <Text className="font-black text-[9px]" style={{ color: colors.accent }}>
                            BEST VALUE
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="font-extrabold text-xs" style={{ color: colors.textPrimary }}>
                      ৳{st.totalBDT}
                    </Text>
                  </View>
                ))}

                {Boolean(basketOpt?.potentialSavingsBDT && basketOpt.potentialSavingsBDT > 0) && (
                  <Text className="text-xs font-extrabold mt-2.5" style={{ color: colors.accent }}>
                    💡 Shopping at {basketOpt?.cheapestStoreName} saves ৳
                    {basketOpt?.potentialSavingsBDT}!
                  </Text>
                )}
              </Animated.View>
            )}

            {/* SPLIT ORDER STRATEGY */}
            {Boolean(
              basketSplitOpt &&
              Array.isArray(basketSplitOpt.itemAllocations) &&
              basketSplitOpt.itemAllocations.length > 0,
            ) && (
              <Animated.View
                entering={FadeInDown.duration(450).springify()}
                className="py-5 border-b"
                style={{ borderBottomColor: colors.borderSubtle }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Split size={15} color={colors.accent} style={{ marginRight: 6 }} />
                    <Text
                      className="text-[14px] font-extrabold tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Split Order Strategy
                    </Text>
                  </View>
                  <Text className="font-extrabold text-xs" style={{ color: colors.accent }}>
                    Savings: ৳{basketSplitOpt?.extraSplitSavingsBDT || 0}
                  </Text>
                </View>

                {basketSplitOpt?.itemAllocations?.map((alloc, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between py-2 border-b last:border-b-0"
                    style={{ borderColor: colors.borderSubtle }}
                  >
                    <Text
                      className="font-medium text-xs flex-1 mr-2"
                      style={{ color: colors.textPrimary }}
                      numberOfLines={1}
                    >
                      {alloc.itemName}
                    </Text>
                    <Text className="font-bold text-xs mr-2" style={{ color: colors.accent }}>
                      {alloc.bestStoreName}
                    </Text>
                    <Text className="font-bold text-xs" style={{ color: colors.textPrimary }}>
                      ৳{alloc.priceBDT}
                    </Text>
                  </View>
                ))}

                <View className="mt-2.5 pt-2 flex-row justify-between items-center">
                  <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                    Split Total Cost
                  </Text>
                  <Text className="text-sm font-extrabold" style={{ color: colors.accent }}>
                    ৳{basketSplitOpt?.splitTotalBDT || 0}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* MONTHLY BUDGET TRACKER */}
            {monthlyAnalytics && (
              <Animated.View
                entering={FadeInDown.duration(500).springify()}
                className="py-5 border-b"
                style={{ borderBottomColor: colors.borderSubtle }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Wallet size={15} color={colors.warning} style={{ marginRight: 6 }} />
                    <Text
                      className="text-[14px] font-extrabold tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      Monthly Family Budget
                    </Text>
                  </View>
                  <Text className="font-bold text-xs" style={{ color: colors.textSecondary }}>
                    ৳{monthlyAnalytics.totalSpentBDT} / ৳{monthlyAnalytics.budgetBDT}
                  </Text>
                </View>

                <View className="mb-2 flex-row justify-between items-center">
                  <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                    Utilization ({monthlyAnalytics.budgetUtilizationPercentage}%)
                  </Text>
                  <Text className="text-xs font-bold" style={{ color: colors.accent }}>
                    ৳{monthlyAnalytics.remainingBudgetBDT} Remaining
                  </Text>
                </View>
                <ProgressBar
                  progress={monthlyAnalytics.budgetUtilizationPercentage}
                  color={
                    monthlyAnalytics.budgetUtilizationPercentage > 90
                      ? colors.danger
                      : colors.accent
                  }
                  backgroundColor={colors.bgInput}
                  height={6}
                />
              </Animated.View>
            )}

            {/* TOP PURCHASED & CONSUMPTION STAPLES */}
            {topPurchasedItems.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(520).springify()}
                className="py-5 border-b"
                style={{ borderBottomColor: colors.borderSubtle }}
              >
                <View className="flex-row items-center mb-3">
                  <ShoppingBag size={15} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text
                    className="text-[14px] font-extrabold tracking-tight"
                    style={{ color: colors.textPrimary }}
                  >
                    Top Purchased & Staples
                  </Text>
                </View>

                {topPurchasedItems.map((top, idx) => (
                  <View
                    key={top.name}
                    className="flex-row items-center justify-between py-2 border-b last:border-b-0"
                    style={{ borderColor: colors.borderSubtle }}
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Text
                        className="text-[11px] font-bold mr-2"
                        style={{ color: colors.textMuted }}
                      >
                        #{idx + 1}
                      </Text>
                      <View className="flex-1">
                        <Text className="font-bold text-xs" style={{ color: colors.textPrimary }}>
                          {top.name}
                        </Text>
                        <Text className="text-[10px]" style={{ color: colors.textMuted }}>
                          {top.category}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text
                        className="font-extrabold text-xs"
                        style={{ color: colors.textPrimary }}
                      >
                        {top.count}x added
                      </Text>
                      {top.estCost > 0 ? (
                        <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
                          ৳{top.estCost}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* PRICE DROP MONITORS */}
            <Animated.View
              entering={FadeInDown.duration(540).springify()}
              className="py-5 border-b"
              style={{ borderBottomColor: colors.borderSubtle }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Bell size={15} color={colors.warning} style={{ marginRight: 6 }} />
                  <Text
                    className="text-[14px] font-extrabold tracking-tight"
                    style={{ color: colors.textPrimary }}
                  >
                    Price Drop Monitors ({(priceAlerts || []).length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => checkAlertsMutation.mutate()}
                  disabled={checkAlertsMutation.isPending}
                  className="flex-row items-center"
                >
                  <RefreshCw size={12} color={colors.warning} style={{ marginRight: 4 }} />
                  <Text className="font-bold text-xs" style={{ color: colors.warning }}>
                    {checkAlertsMutation.isPending ? "Checking..." : "Refresh"}
                  </Text>
                </TouchableOpacity>
              </View>

              {!priceAlerts || priceAlerts.length === 0 ? (
                <Text className="text-xs py-1 font-medium" style={{ color: colors.textMuted }}>
                  No active price drop monitors set.
                </Text>
              ) : (
                (priceAlerts || []).map((alert) => (
                  <View
                    key={alert.id}
                    className="flex-row items-center justify-between py-2 border-b last:border-b-0"
                    style={{ borderColor: colors.borderSubtle }}
                  >
                    <View className="flex-1 mr-2">
                      <Text className="font-bold text-xs" style={{ color: colors.textPrimary }}>
                        {alert.query}
                      </Text>
                      <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                        Target: ৳{alert.targetPriceBDT} • Current: ৳
                        {alert.currentBestPriceBDT || alert.targetPriceBDT}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteAlertMutation.mutate(alert.id)}
                      className="p-1"
                    >
                      <Trash2 size={15} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </Animated.View>

            {/* CATEGORIES DISTRIBUTION */}
            <Animated.View entering={FadeInDown.duration(580).springify()} className="py-5">
              <View className="flex-row items-center mb-3">
                <PieChart size={15} color={colors.accent} style={{ marginRight: 6 }} />
                <Text
                  className="text-[14px] font-extrabold tracking-tight"
                  style={{ color: colors.textPrimary }}
                >
                  Category Distribution
                </Text>
              </View>

              {categoryData.map(([cat, count], index) => (
                <View key={cat} className={index !== 0 ? "mt-3" : ""}>
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                      {cat}
                    </Text>
                    <Text className="text-[11px] font-bold" style={{ color: colors.accent }}>
                      {count} item{count !== 1 ? "s" : ""} (
                      {Math.round((count / summary.total) * 100)}%)
                    </Text>
                  </View>
                  <ProgressBar
                    progress={(count / summary.total) * 100}
                    color={index === 0 ? colors.accent : colors.accentDark}
                    backgroundColor={colors.bgInput}
                    height={5}
                  />
                </View>
              ))}
            </Animated.View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-10 pt-20">
            <View
              className="h-14 w-14 rounded-2xl items-center justify-center mb-3 border"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
            >
              <BarChart3 size={28} stroke={colors.icon} strokeWidth={1.5} />
            </View>
            <Text className="text-base font-bold text-center" style={{ color: colors.textPrimary }}>
              No Data for {toMonthYear(selectedMonth)}
            </Text>
            <Text
              className="text-center mt-1 text-xs leading-5"
              style={{ color: colors.textSecondary }}
            >
              Start adding and completing items to see your family&apos;s shopping trends.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;
