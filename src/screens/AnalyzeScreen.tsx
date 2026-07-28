import React, { useMemo, useState } from "react";
import { AnalyzeStackScreenProps, ERootRoutes } from "../types";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { AppHeader, Card, DonutChart, ProgressBar } from "../components/ui";

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

/**
 * Premium Analytics Screen
 * Why: To provide a consistent, high-fidelity experience for tracking grocery habits via Python backend API.
 * Fix: Re-implemented DonutChart using react-native-gifted-charts for stability and animation.
 * Note: Enforces a single light theme.
 */
const AnalyzeScreen = ({ navigation }: AnalyzeStackScreenProps) => {
  const { user } = useAuthStore();
  const { toDate, toMonthYear } = useDateFormatter();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // TanStack Query Hook for Python Backend API
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

  // Filtering items for the selected month
  const monthlyItems = useMemo(() => {
    return items.filter((item) => {
      const date = toDate(item.createdAt);
      if (!date) return false;
      return (
        date.getMonth() === selectedMonth.getMonth() &&
        date.getFullYear() === selectedMonth.getFullYear()
      );
    });
  }, [items, selectedMonth, toDate]);

  const summary = useMemo(() => {
    const total = monthlyItems.length;
    const completed = monthlyItems.filter((i) => i.status === "completed").length;
    const pending = monthlyItems.filter((i) => i.status === "pending").length;
    const urgent = monthlyItems.filter(
      (i) => i.status === "pending" && i.priority === "Urgent",
    ).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, urgent, completionRate };
  }, [monthlyItems]);

  const dueDateStats = useMemo(() => {
    const now = new Date();
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    let overdue = 0;
    let dueSoon = 0;
    monthlyItems.forEach((item) => {
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
  }, [monthlyItems]);

  const monthlyEstimatedSpend = useMemo(() => {
    return monthlyItems.reduce((sum, item) => {
      if (typeof item.estimatedTotal === "number" && Number.isFinite(item.estimatedTotal)) {
        return sum + item.estimatedTotal;
      }
      if (typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice)) {
        return sum + item.unitPrice;
      }
      return sum;
    }, 0);
  }, [monthlyItems]);

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
    monthlyItems.forEach((item) => {
      stats[item.category] = (stats[item.category] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [monthlyItems]);

  /**
   * Adjusts the selected month by the given offset
   * @param offset - Number of months to add/subtract
   */
  const changeMonth = (offset: number) => {
    setSelectedMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + offset);
      return next;
    });
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title="Analytics"
        eyebrow="Overview"
        onNotificationPress={() => navigation.navigate(ERootRoutes.NOTIFICATIONS)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1"
      >
        {/* Month Selector */}
        <View className="px-6 pt-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white border border-border shadow-xs"
          >
            <ChevronLeft size={20} stroke="#4A5568" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <CalendarIcon size={16} stroke="#10B981" className="mr-2" />
            <Text className="text-[17px] font-bold text-text-primary">
              {toMonthYear(selectedMonth)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => changeMonth(1)}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white border border-border shadow-xs"
          >
            <ChevronRight size={20} stroke="#4A5568" />
          </TouchableOpacity>
        </View>

        {analyticsErrorMessage ? (
          <View className="mx-6 mt-4 rounded-2xl border border-warning-light bg-warning-light/40 px-4 py-3">
            <View className="flex-row items-start">
              <AlertTriangle size={16} stroke="#F5A623" />
              <Text className="ml-2 flex-1 text-[12px] font-medium leading-5 text-warning-dark">
                {analyticsErrorMessage}
              </Text>
            </View>
          </View>
        ) : null}

        {monthlyItems.length > 0 ? (
          <>
            <View className="px-6 pt-6">
              <Card className="mb-6 p-5">
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-[16px] font-bold text-text-primary">Month Insights</Text>
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    vs {toMonthYear(previousMonth)}
                  </Text>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 rounded-xl border border-border/60 bg-surface-alt p-3">
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Item Volume
                    </Text>
                    <Text className="mt-1 text-[18px] font-bold text-text-primary">
                      {insights.itemDelta >= 0 ? "+" : ""}
                      {insights.itemDelta}
                    </Text>
                    <Text className="text-[12px] font-medium text-text-secondary">
                      {summary.total} this month
                    </Text>
                  </View>

                  <View className="flex-1 rounded-xl border border-border/60 bg-surface-alt p-3">
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Completion
                    </Text>
                    <Text className="mt-1 text-[18px] font-bold text-text-primary">
                      {insights.completionDelta >= 0 ? "+" : ""}
                      {insights.completionDelta}%
                    </Text>
                    <Text className="text-[12px] font-medium text-text-secondary">
                      {summary.completionRate}% this month
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            {/* Main Stats Card with Professional Donut Chart */}
            <View className="px-6 pt-2">
              <Card className="mb-8 items-center py-10">
                <DonutChart
                  total={summary.total}
                  data={[
                    { value: summary.completed, color: "#10B981" },
                    { value: Math.max(0, summary.pending - summary.urgent), color: "#F5A623" },
                    { value: summary.urgent, color: "#E55C5C" },
                  ]}
                  size={160}
                  strokeWidth={16}
                />

                <View className="mt-10 flex-row flex-wrap justify-center gap-6">
                  <View className="flex-row items-center">
                    <View className="h-2.5 w-2.5 rounded-full bg-primary-500 mr-2" />
                    <Text className="text-[13px] font-bold text-text-primary mr-1">
                      {summary.completed}
                    </Text>
                    <Text className="text-[13px] font-medium text-text-muted">Done</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="h-2.5 w-2.5 rounded-full bg-warning-DEFAULT mr-2" />
                    <Text className="text-[13px] font-bold text-text-primary mr-1">
                      {summary.pending}
                    </Text>
                    <Text className="text-[13px] font-medium text-text-muted">Pending</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="h-2.5 w-2.5 rounded-full bg-danger-DEFAULT mr-2" />
                    <Text className="text-[13px] font-bold text-text-primary mr-1">
                      {summary.urgent}
                    </Text>
                    <Text className="text-[13px] font-medium text-text-muted">Urgent</Text>
                  </View>
                </View>
              </Card>
            </View>

            {/* Quick Metrics */}
            <View className="px-6 flex-row gap-4 mb-8">
              <View className="flex-1 bg-surface-alt rounded-2xl p-4 border border-border/50">
                <TrendingUp size={18} stroke="#10B981" className="mb-2" />
                <Text className="text-2xl font-bold text-text-primary">{summary.total}</Text>
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Total Items
                </Text>
              </View>
              <View className="flex-1 bg-surface-alt rounded-2xl p-4 border border-border/50">
                <BarChart3 size={18} stroke="#4A90D9" className="mb-2" />
                <Text className="text-2xl font-bold text-text-primary">{categoryData.length}</Text>
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Categories
                </Text>
              </View>
            </View>

            <View className="px-6 mb-8 flex-row gap-4">
              <View className="flex-1 bg-surface-alt rounded-2xl p-4 border border-border/50">
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Overdue
                </Text>
                <Text className="mt-1 text-2xl font-bold text-danger-dark">
                  {dueDateStats.overdue}
                </Text>
              </View>
              <View className="flex-1 bg-surface-alt rounded-2xl p-4 border border-border/50">
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Due Soon
                </Text>
                <Text className="mt-1 text-2xl font-bold text-warning-dark">
                  {dueDateStats.dueSoon}
                </Text>
              </View>
              <View className="flex-1 bg-surface-alt rounded-2xl p-4 border border-border/50">
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  Est. Spend
                </Text>
                <Text className="mt-1 text-2xl font-bold text-primary-700">
                  ৳
                  {monthlyEstimatedSpend > 0
                    ? monthlyEstimatedSpend
                    : monthlyAnalytics?.totalSpentBDT || 0}
                </Text>
              </View>
            </View>

            {/* SUPERSTORE BASKET OPTIMIZER (Shwapno, Meena Bazar, Agora) */}
            {Boolean(basketOpt && Array.isArray(basketOpt.storeTotals)) && (
              <View className="px-6 mb-8">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Store size={20} color="#10B981" style={{ marginRight: 6 }} />
                    <Text className="text-text-primary text-[18px] font-bold tracking-tight">
                      Superstore Basket Compare
                    </Text>
                  </View>
                  <View className="bg-emerald-100 px-2.5 py-1 rounded-full">
                    <Text className="text-emerald-700 font-bold text-xs">
                      Best: {basketOpt?.cheapestStoreName || "Store"}
                    </Text>
                  </View>
                </View>

                <Card className="p-5">
                  <Text className="text-xs text-slate-500 mb-3 font-medium">
                    Total cost to buy all {basketOpt?.totalItemsCount || 0} active items in your
                    family list across retailers:
                  </Text>

                  {basketOpt?.storeTotals?.map((st, i) => (
                    <View
                      key={st.storeName || i}
                      className={`flex-row items-center justify-between py-2.5 px-3 rounded-xl mb-2 ${
                        st.storeName === basketOpt?.cheapestStoreName
                          ? "bg-emerald-50 border border-emerald-300"
                          : "bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <View className="flex-row items-center">
                        <Text className="font-bold text-slate-800 text-sm mr-2">
                          {st.storeName}
                        </Text>
                        {st.storeName === basketOpt?.cheapestStoreName && (
                          <View className="bg-emerald-600 px-1.5 py-0.5 rounded">
                            <Text className="text-white font-bold text-[9px]">CHEAPEST</Text>
                          </View>
                        )}
                      </View>
                      <Text className="font-extrabold text-slate-900 text-sm">৳{st.totalBDT}</Text>
                    </View>
                  ))}

                  {Boolean(basketOpt?.potentialSavingsBDT && basketOpt.potentialSavingsBDT > 0) && (
                    <Text className="text-emerald-600 text-xs font-bold mt-2 text-center">
                      💡 Buying at {basketOpt?.cheapestStoreName} saves your family ৳
                      {basketOpt?.potentialSavingsBDT}!
                    </Text>
                  )}
                </Card>
              </View>
            )}

            {/* SPLIT ORDER STRATEGY CARD */}
            {Boolean(
              basketSplitOpt &&
              Array.isArray(basketSplitOpt.itemAllocations) &&
              basketSplitOpt.itemAllocations.length > 0,
            ) && (
              <View className="px-6 mb-8">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Split size={20} color="#8B5CF6" style={{ marginRight: 6 }} />
                    <Text className="text-text-primary text-[18px] font-bold tracking-tight">
                      Split Store Order Strategy
                    </Text>
                  </View>
                  <View className="bg-purple-100 px-2.5 py-1 rounded-full">
                    <Text className="text-purple-700 font-bold text-xs">
                      Max Savings: ৳{basketSplitOpt?.extraSplitSavingsBDT || 0}
                    </Text>
                  </View>
                </View>

                <Card className="p-5">
                  <Text className="text-xs text-slate-500 mb-3 font-medium">
                    Allocating items to store with absolute lowest price saves an extra ৳
                    {basketSplitOpt?.extraSplitSavingsBDT || 0} over single store purchase:
                  </Text>

                  {basketSplitOpt?.itemAllocations?.map((alloc, idx) => (
                    <View
                      key={idx}
                      className="flex-row items-center justify-between py-2 border-b border-slate-100"
                    >
                      <View className="flex-1 mr-2">
                        <Text className="font-semibold text-slate-800 text-xs" numberOfLines={1}>
                          {alloc.itemName}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mr-2">
                          <Text className="text-purple-700 font-bold text-[10px]">
                            {alloc.bestStoreName}
                          </Text>
                        </View>
                        <Text className="font-bold text-slate-900 text-xs">৳{alloc.priceBDT}</Text>
                      </View>
                    </View>
                  ))}

                  <View className="mt-3 pt-3 border-t border-slate-200 flex-row justify-between items-center">
                    <Text className="text-xs font-bold text-slate-700">Split Total Cost</Text>
                    <Text className="text-sm font-extrabold text-purple-700">
                      ৳{basketSplitOpt?.splitTotalBDT || 0}
                    </Text>
                  </View>
                </Card>
              </View>
            )}

            {/* MY PRICE DROP ALERTS CARD */}
            <View className="px-6 mb-8">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Bell size={20} color="#F59E0B" style={{ marginRight: 6 }} />
                  <Text className="text-text-primary text-[18px] font-bold tracking-tight">
                    Price Drop Monitors ({(priceAlerts || []).length})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => checkAlertsMutation.mutate()}
                  disabled={checkAlertsMutation.isPending}
                  className="flex-row items-center bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200"
                >
                  <RefreshCw size={12} color="#D97706" style={{ marginRight: 4 }} />
                  <Text className="text-amber-700 font-bold text-xs">
                    {checkAlertsMutation.isPending ? "Checking..." : "Refresh Prices"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Card className="p-5">
                {!priceAlerts || priceAlerts.length === 0 ? (
                  <View className="py-4 items-center">
                    <Text className="text-xs text-slate-500 text-center font-medium">
                      No active price drop monitors set. Click &quot;Set Price Alert&quot; on any
                      product card!
                    </Text>
                  </View>
                ) : (
                  (priceAlerts || []).map((alert) => (
                    <View
                      key={alert.id}
                      className="flex-row items-center justify-between py-2.5 border-b border-slate-100"
                    >
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center">
                          <Text className="font-bold text-slate-800 text-sm">{alert.query}</Text>
                          {alert.unit && (
                            <Text className="text-xs text-slate-400 ml-1">({alert.unit})</Text>
                          )}
                        </View>
                        <Text className="text-xs text-slate-500 mt-0.5">
                          Target: ৳{alert.targetPriceBDT} • Current: ৳
                          {alert.currentBestPriceBDT || alert.targetPriceBDT} (
                          {alert.currentBestStore || "Shwapno"})
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => deleteAlertMutation.mutate(alert.id)}
                        className="p-1.5 rounded-lg bg-red-50"
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </Card>
            </View>

            {/* MEAL CONSUMPTION & USAGE REPORT */}
            {Boolean(
              monthlyAnalytics &&
              Array.isArray(monthlyAnalytics.mealBreakdown) &&
              monthlyAnalytics.mealBreakdown.length > 0,
            ) && (
              <View className="px-6 mb-8">
                <View className="flex-row items-center mb-3">
                  <Utensils size={20} color="#3B82F6" style={{ marginRight: 6 }} />
                  <Text className="text-text-primary text-[18px] font-bold tracking-tight">
                    Meal Usage Breakdown
                  </Text>
                </View>

                <Card className="p-5">
                  {monthlyAnalytics?.mealBreakdown?.map((meal) => (
                    <View key={meal.mealType} className="mb-4 pb-3 border-b border-slate-100">
                      <View className="flex-row justify-between items-center mb-1">
                        <Text className="font-bold text-slate-900 text-sm">
                          {meal.mealType} ({meal.itemCount} items)
                        </Text>
                        <Text className="font-extrabold text-blue-600 text-sm">
                          ৳{meal.totalSpentBDT}
                        </Text>
                      </View>
                      {Array.isArray(meal.topItems) &&
                        meal.topItems.map((top, idx) => (
                          <Text key={idx} className="text-slate-500 text-xs mt-0.5">
                            • {top.name} ({top.quantity}) — used {top.frequency}x
                          </Text>
                        ))}
                    </View>
                  ))}
                </Card>
              </View>
            )}

            {/* MONTHLY BUDGET TRACKER */}
            {monthlyAnalytics && (
              <View className="px-6 mb-8">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Wallet size={20} color="#F59E0B" style={{ marginRight: 6 }} />
                    <Text className="text-text-primary text-[18px] font-bold tracking-tight">
                      Monthly Family Budget
                    </Text>
                  </View>
                  <Text className="text-slate-500 font-bold text-xs">
                    ৳{monthlyAnalytics.totalSpentBDT} / ৳{monthlyAnalytics.budgetBDT}
                  </Text>
                </View>

                <Card className="p-5">
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
                    color={
                      monthlyAnalytics.budgetUtilizationPercentage > 90 ? "#EF4444" : "#10B981"
                    }
                    height={10}
                  />
                </Card>
              </View>
            )}

            {/* Categories List */}
            <View className="px-6">
              <Text className="text-text-primary text-[18px] font-bold tracking-tight mb-5">
                Category Distribution
              </Text>
              <Card className="p-6">
                {categoryData.map(([cat, count], index) => (
                  <View key={cat} className={index !== 0 ? "mt-6" : ""}>
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-[15px] font-bold text-text-primary">{cat}</Text>
                      <Text className="text-[13px] font-bold text-primary-500">
                        {count} item{count !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <ProgressBar
                      progress={(count / summary.total) * 100}
                      color={index === 0 ? "#10B981" : index === 1 ? "#4A90D9" : "#F5A623"}
                      height={8}
                    />
                  </View>
                ))}
              </Card>
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center px-10 pt-20">
            <View className="h-20 w-20 rounded-3xl bg-surface-alt items-center justify-center mb-6">
              <BarChart3 size={40} stroke="#9AA3AF" strokeWidth={1.5} />
            </View>
            <Text className="text-xl font-bold text-text-primary text-center">
              No Data for {toMonthYear(selectedMonth)}
            </Text>
            <Text className="text-text-secondary text-center mt-2 leading-6">
              Start adding and completing items to see your family&apos;s shopping trends.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyzeScreen;
