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
  Utensils,
  Wallet,
  Bell,
  RefreshCw,
  Trash2,
  Split,
  Zap,
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

  const dueDateStats = useMemo(() => {
    const now = new Date();
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    let overdue = 0;
    let dueSoon = 0;
    filteredTimeframeItems.forEach((item) => {
      const due = item.dueDate ? new Date(item.dueDate as unknown as string | Date) : null;
      if (!(due instanceof Date) || Number.isNaN(due.getTime())) {
        return;
      }
      if (item.status === "completed") {
        return;
      }
      if (due < now) {
        overdue += 1;
      } else if (due <= inThreeDays) {
        dueSoon += 1;
      }
    });

    return { overdue, dueSoon };
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

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title="Analytics"
        eyebrow="Financial & Shopping Intelligence"
        onNotificationPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="flex-1 bg-white"
      >
        {/* Timeframe Filter Pills */}
        <Animated.View entering={FadeInDown.duration(300).springify()} className="px-6 pt-3">
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
            <TouchableOpacity
              onPress={() => setTimeframe("month")}
              className={`px-4 py-1.5 rounded-full ${
                timeframe === "month" ? "bg-slate-900" : "bg-slate-50"
              }`}
            >
              <Text
                className={`text-[12px] font-bold ${
                  timeframe === "month" ? "text-white" : "text-slate-600"
                }`}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTimeframe("quarter")}
              className={`px-4 py-1.5 rounded-full ${
                timeframe === "quarter" ? "bg-slate-900" : "bg-slate-50"
              }`}
            >
              <Text
                className={`text-[12px] font-bold ${
                  timeframe === "quarter" ? "text-white" : "text-slate-600"
                }`}
              >
                3 Months
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTimeframe("year")}
              className={`px-4 py-1.5 rounded-full ${
                timeframe === "year" ? "bg-slate-900" : "bg-slate-50"
              }`}
            >
              <Text
                className={`text-[12px] font-bold ${
                  timeframe === "year" ? "text-white" : "text-slate-600"
                }`}
              >
                Yearly
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Month Selector Navigation with Breathing Space */}
        <View className="px-6 py-5 flex-row items-center justify-between border-b border-slate-100">
          <TouchableOpacity onPress={() => changeMonth(-1)} className="p-1.5">
            <ChevronLeft size={22} stroke="#475569" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <CalendarIcon size={16} stroke="#059669" className="mr-2" />
            <Text className="text-[17px] font-extrabold text-slate-900">
              {toMonthYear(selectedMonth)}
            </Text>
          </View>

          <TouchableOpacity onPress={() => changeMonth(1)} className="p-1.5">
            <ChevronRight size={22} stroke="#475569" />
          </TouchableOpacity>
        </View>

        {analyticsErrorMessage ? (
          <View className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <View className="flex-row items-start">
              <AlertTriangle size={16} stroke="#D97706" />
              <Text className="ml-2 flex-1 text-[12px] font-medium leading-5 text-amber-900">
                {analyticsErrorMessage}
              </Text>
            </View>
          </View>
        ) : null}

        {filteredTimeframeItems.length > 0 ? (
          <>
            {/* MoM Performance Section */}
            <Animated.View
              entering={FadeInDown.duration(350).springify()}
              className="px-6 pt-5 pb-4 border-b border-slate-100"
            >
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-[15px] font-extrabold text-slate-900">
                  Growth & Performance
                </Text>
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  vs {toMonthYear(previousMonth)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Item Volume
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <TrendingUp
                      size={14}
                      stroke={insights.itemDelta >= 0 ? "#10B981" : "#EF4444"}
                      className="mr-1"
                    />
                    <Text className="text-[18px] font-black text-slate-900">
                      {insights.itemDelta >= 0 ? "+" : ""}
                      {insights.itemDelta}
                    </Text>
                  </View>
                  <Text className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {summary.total} total items
                  </Text>
                </View>

                <View className="w-[1px] h-10 bg-slate-100 mx-4" />

                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Completion Delta
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Zap
                      size={14}
                      stroke={insights.completionDelta >= 0 ? "#10B981" : "#F59E0B"}
                      className="mr-1"
                    />
                    <Text className="text-[18px] font-black text-slate-900">
                      {insights.completionDelta >= 0 ? "+" : ""}
                      {insights.completionDelta}%
                    </Text>
                  </View>
                  <Text className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {summary.completionRate}% completion
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Donut Chart Section */}
            <Animated.View
              entering={FadeInDown.duration(400).springify()}
              className="px-6 py-6 border-b border-slate-100 items-center"
            >
              <DonutChart
                total={summary.total}
                data={[
                  { value: summary.completed, color: "#10B981" },
                  { value: Math.max(0, summary.pending - summary.urgent), color: "#F5A623" },
                  { value: summary.urgent, color: "#EF4444" },
                ]}
                size={140}
                strokeWidth={12}
              />

              <View className="mt-6 flex-row flex-wrap justify-center gap-4">
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                  <Text className="text-[13px] font-bold text-slate-900 mr-1">
                    {summary.completed}
                  </Text>
                  <Text className="text-[11px] font-semibold text-slate-500">Done</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                  <Text className="text-[13px] font-bold text-slate-900 mr-1">
                    {summary.pending}
                  </Text>
                  <Text className="text-[11px] font-semibold text-slate-500">Pending</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-rose-500 mr-2" />
                  <Text className="text-[13px] font-bold text-slate-900 mr-1">
                    {summary.urgent}
                  </Text>
                  <Text className="text-[11px] font-semibold text-slate-500">Urgent</Text>
                </View>
              </View>
            </Animated.View>

            {/* Quick Metrics Bar */}
            <View className="px-6 py-5 flex-row justify-between border-b border-slate-100">
              <View className="flex-1 items-center">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Items
                </Text>
                <Text className="text-xl font-black text-slate-900 mt-1">{summary.total}</Text>
              </View>
              <View className="w-[1px] h-8 bg-slate-100" />
              <View className="flex-1 items-center">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Categories
                </Text>
                <Text className="text-xl font-black text-slate-900 mt-1">
                  {categoryData.length}
                </Text>
              </View>
              <View className="w-[1px] h-8 bg-slate-100" />
              <View className="flex-1 items-center">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Est. Spend
                </Text>
                <Text className="text-xl font-black text-emerald-700 mt-1">
                  ৳
                  {monthlyEstimatedSpend > 0
                    ? monthlyEstimatedSpend
                    : monthlyAnalytics?.totalSpentBDT || 0}
                </Text>
              </View>
            </View>

            {/* Shopping Velocity & Efficiency */}
            <Animated.View
              entering={FadeInDown.duration(450).springify()}
              className="px-6 py-5 border-b border-slate-100"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Zap size={16} color="#059669" style={{ marginRight: 6 }} />
                  <Text className="text-slate-900 text-[15px] font-extrabold tracking-tight">
                    Shopping Efficiency
                  </Text>
                </View>
                <Text className="text-emerald-700 font-bold text-xs">
                  {shoppingVelocity.urgentResolutionRate}% Urgent Cleared
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2">
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase">
                    Avg. Volume / Wk
                  </Text>
                  <Text className="text-[15px] font-extrabold text-slate-900 mt-0.5">
                    {shoppingVelocity.itemsPerWeek} items
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase">
                    Urgent Resolution
                  </Text>
                  <Text className="text-[15px] font-extrabold text-emerald-600 mt-0.5">
                    {shoppingVelocity.urgentResolutionRate}%
                  </Text>
                </View>
              </View>

              {(dueDateStats.overdue > 0 || dueDateStats.dueSoon > 0) && (
                <View className="mt-3 pt-2.5 border-t border-slate-100 flex-row justify-between items-center">
                  <Text className="text-[11px] font-bold text-slate-500">Due Date Attention</Text>
                  <View className="flex-row items-center gap-2">
                    {dueDateStats.overdue > 0 && (
                      <Text className="text-rose-600 font-bold text-xs">
                        {dueDateStats.overdue} Overdue
                      </Text>
                    )}
                    {dueDateStats.dueSoon > 0 && (
                      <Text className="text-amber-700 font-bold text-xs">
                        {dueDateStats.dueSoon} Due Soon
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </Animated.View>

            {/* SUPERSTORE BASKET OPTIMIZER */}
            {Boolean(basketOpt && Array.isArray(basketOpt.storeTotals)) && (
              <Animated.View
                entering={FadeInDown.duration(480).springify()}
                className="px-6 py-5 border-b border-slate-100"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Store size={16} color="#059669" style={{ marginRight: 6 }} />
                    <Text className="text-slate-900 text-[15px] font-extrabold tracking-tight">
                      Superstore Basket Compare
                    </Text>
                  </View>
                  <Text className="text-emerald-700 font-bold text-xs">
                    Best: {basketOpt?.cheapestStoreName || "Store"}
                  </Text>
                </View>

                <Text className="text-xs text-slate-500 mb-3 font-medium">
                  Total cost to buy all {basketOpt?.totalItemsCount || 0} active items across
                  retailers:
                </Text>

                {basketOpt?.storeTotals?.map((st, i) => (
                  <View
                    key={st.storeName || i}
                    className="flex-row items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
                  >
                    <View className="flex-row items-center">
                      <Text className="font-bold text-slate-800 text-xs mr-2">{st.storeName}</Text>
                      {st.storeName === basketOpt?.cheapestStoreName && (
                        <Text className="text-emerald-600 font-black text-[9px]">● BEST VALUE</Text>
                      )}
                    </View>
                    <Text className="font-extrabold text-slate-900 text-xs">৳{st.totalBDT}</Text>
                  </View>
                ))}

                {Boolean(basketOpt?.potentialSavingsBDT && basketOpt.potentialSavingsBDT > 0) && (
                  <Text className="text-emerald-700 text-xs font-bold mt-2.5">
                    💡 Buying at {basketOpt?.cheapestStoreName} saves ৳
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
                entering={FadeInDown.duration(500).springify()}
                className="px-6 py-5 border-b border-slate-100"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Split size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                    <Text className="text-slate-900 text-[15px] font-extrabold tracking-tight">
                      Split Order Strategy
                    </Text>
                  </View>
                  <Text className="text-purple-700 font-bold text-xs">
                    Savings: ৳{basketSplitOpt?.extraSplitSavingsBDT || 0}
                  </Text>
                </View>

                {basketSplitOpt?.itemAllocations?.map((alloc, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
                  >
                    <Text
                      className="font-medium text-slate-800 text-xs flex-1 mr-2"
                      numberOfLines={1}
                    >
                      {alloc.itemName}
                    </Text>
                    <Text className="text-purple-700 font-bold text-xs mr-2">
                      {alloc.bestStoreName}
                    </Text>
                    <Text className="font-bold text-slate-900 text-xs">৳{alloc.priceBDT}</Text>
                  </View>
                ))}

                <View className="mt-3 pt-2.5 border-t border-slate-100 flex-row justify-between items-center">
                  <Text className="text-xs font-bold text-slate-700">Split Total Cost</Text>
                  <Text className="text-sm font-extrabold text-purple-700">
                    ৳{basketSplitOpt?.splitTotalBDT || 0}
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* TOP PURCHASED & FREQUENTLY ADDED ITEMS */}
            {topPurchasedItems.length > 0 && (
              <Animated.View
                entering={FadeInDown.duration(520).springify()}
                className="px-6 py-5 border-b border-slate-100"
              >
                <View className="flex-row items-center mb-3">
                  <ShoppingBag size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text className="text-slate-900 text-[15px] font-extrabold tracking-tight">
                    Top Purchased & Added Items
                  </Text>
                </View>

                {topPurchasedItems.map((top, idx) => (
                  <View
                    key={top.name}
                    className="flex-row items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Text className="text-[11px] font-bold text-slate-400 mr-2">#{idx + 1}</Text>
                      <View className="flex-1">
                        <Text className="font-bold text-slate-900 text-xs">{top.name}</Text>
                        <Text className="text-[10px] text-slate-400">{top.category}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="font-extrabold text-slate-900 text-xs">
                        {top.count}x added
                      </Text>
                      {top.estCost > 0 ? (
                        <Text className="text-[10px] text-emerald-600 font-bold">
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
              className="px-6 py-5 border-b border-slate-100"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Bell size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                  <Text className="text-slate-900 text-[15px] font-extrabold tracking-tight">
                    Price Drop Monitors ({(priceAlerts || []).length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => checkAlertsMutation.mutate()}
                  disabled={checkAlertsMutation.isPending}
                  className="flex-row items-center"
                >
                  <RefreshCw size={12} color="#D97706" style={{ marginRight: 4 }} />
                  <Text className="text-amber-800 font-bold text-xs">
                    {checkAlertsMutation.isPending ? "Checking..." : "Refresh"}
                  </Text>
                </TouchableOpacity>
              </View>

              {!priceAlerts || priceAlerts.length === 0 ? (
                <Text className="text-xs text-slate-400 py-2 font-medium">
                  No active price drop monitors set.
                </Text>
              ) : (
                (priceAlerts || []).map((alert) => (
                  <View
                    key={alert.id}
                    className="flex-row items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
                  >
                    <View className="flex-1 mr-2">
                      <Text className="font-bold text-slate-800 text-xs">{alert.query}</Text>
                      <Text className="text-[11px] text-slate-500 mt-0.5">
                        Target: ৳{alert.targetPriceBDT} • Current: ৳
                        {alert.currentBestPriceBDT || alert.targetPriceBDT}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteAlertMutation.mutate(alert.id)}
                      className="p-1"
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </Animated.View>

            {/* MEAL CONSUMPTION BREAKDOWN */}
            {Boolean(
              monthlyAnalytics &&
              Array.isArray(monthlyAnalytics.mealBreakdown) &&
              monthlyAnalytics.mealBreakdown.length > 0,
            ) && (
              <Animated.View
                entering={FadeInDown.duration(560).springify()}
                className="px-6 py-5 border-b border-slate-100"
              >
                <View className="flex-row items-center mb-3">
                  <Utensils size={16} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text className="text-slate-900 text-[15px] font-extrabold tracking-tight">
                    Meal Usage Breakdown
                  </Text>
                </View>

                {monthlyAnalytics?.mealBreakdown?.map((meal) => (
                  <View
                    key={meal.mealType}
                    className="py-2 border-b border-slate-100 last:border-b-0"
                  >
                    <View className="flex-row justify-between items-center mb-0.5">
                      <Text className="font-bold text-slate-900 text-xs">
                        {meal.mealType} ({meal.itemCount} items)
                      </Text>
                      <Text className="font-extrabold text-blue-600 text-xs">
                        ৳{meal.totalSpentBDT}
                      </Text>
                    </View>
                    {Array.isArray(meal.topItems) &&
                      meal.topItems.map((top, idx) => (
                        <Text key={idx} className="text-slate-500 text-[11px]">
                          • {top.name} ({top.quantity}) — used {top.frequency}x
                        </Text>
                      ))}
                  </View>
                ))}
              </Animated.View>
            )}

            {/* MONTHLY FAMILY BUDGET TRACKER */}
            {monthlyAnalytics && (
              <Animated.View
                entering={FadeInDown.duration(580).springify()}
                className="px-6 py-5 border-b border-slate-100"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Wallet size={16} color="#D97706" style={{ marginRight: 6 }} />
                    <Text className="text-slate-900 text-[15px] font-extrabold tracking-tight">
                      Monthly Family Budget
                    </Text>
                  </View>
                  <Text className="text-slate-500 font-bold text-xs">
                    ৳{monthlyAnalytics.totalSpentBDT} / ৳{monthlyAnalytics.budgetBDT}
                  </Text>
                </View>

                <View className="mb-2 flex-row justify-between items-center">
                  <Text className="text-xs font-bold text-slate-700">
                    Budget Utilization ({monthlyAnalytics.budgetUtilizationPercentage}%)
                  </Text>
                  <Text className="text-xs font-bold text-emerald-600">
                    ৳{monthlyAnalytics.remainingBudgetBDT} Remaining
                  </Text>
                </View>
                <ProgressBar
                  progress={monthlyAnalytics.budgetUtilizationPercentage}
                  color={monthlyAnalytics.budgetUtilizationPercentage > 90 ? "#EF4444" : "#10B981"}
                  height={6}
                />
              </Animated.View>
            )}

            {/* Categories Distribution */}
            <Animated.View entering={FadeInDown.duration(600).springify()} className="px-6 py-5">
              <View className="flex-row items-center mb-3">
                <PieChart size={16} color="#059669" style={{ marginRight: 6 }} />
                <Text className="text-slate-900 text-[15px] font-extrabold tracking-tight">
                  Category Distribution
                </Text>
              </View>

              {categoryData.map(([cat, count], index) => (
                <View key={cat} className={index !== 0 ? "mt-3" : ""}>
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[13px] font-bold text-slate-800">{cat}</Text>
                    <Text className="text-[11px] font-bold text-emerald-700">
                      {count} item{count !== 1 ? "s" : ""} (
                      {Math.round((count / summary.total) * 100)}%)
                    </Text>
                  </View>
                  <ProgressBar
                    progress={(count / summary.total) * 100}
                    color={index === 0 ? "#10B981" : index === 1 ? "#2563EB" : "#F5A623"}
                    height={5}
                  />
                </View>
              ))}
            </Animated.View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center px-10 pt-20">
            <View className="h-14 w-14 rounded-2xl bg-slate-50 items-center justify-center mb-3 border border-slate-100">
              <BarChart3 size={28} stroke="#94A3B8" strokeWidth={1.5} />
            </View>
            <Text className="text-base font-bold text-slate-900 text-center">
              No Data for {toMonthYear(selectedMonth)}
            </Text>
            <Text className="text-slate-500 text-center mt-1 text-xs leading-5">
              Start adding and completing items to see your family&apos;s shopping trends.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;
