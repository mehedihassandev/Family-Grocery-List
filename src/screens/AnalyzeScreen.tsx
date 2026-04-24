import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { ChevronLeft, ChevronRight, BarChart3, TrendingUp, Calendar as CalendarIcon } from "lucide-react-native";
import Svg, { G, Circle } from "react-native-svg";
import { useAuthStore } from "../store/useAuthStore";
import { subscribeToGroceryList } from "../services/grocery";
import { GroceryItem } from "../types";
import { AppHeader, Card } from "../components/ui";
import NotificationModal from "../components/NotificationModal";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const COLORS = ["#59AC77", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];

const toDate = (value: any): Date | null => {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

const formatMonthLabel = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

/**
 * Analytics and insights screen
 * Why: To help users visualize their grocery habits, track completion rates, and identify top spending categories.
 */
const AnalyzeScreen = () => {
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const isDark = colorScheme === "dark";

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

  const monthlyItems = useMemo(() => {
    const start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);

    return items.filter((item) => {
      const created = toDate(item.createdAt);
      if (!created) return false;
      return created >= start && created < end;
    });
  }, [items, selectedMonth]);

  const summary = useMemo(() => {
    const total = monthlyItems.length;
    const completed = monthlyItems.filter((item) => item.status === "completed").length;
    const pending = monthlyItems.filter((item) => item.status === "pending").length;
    const urgent = monthlyItems.filter(
      (item) => item.status === "pending" && item.priority === "Urgent",
    ).length;
    const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, pending, urgent, completionRate };
  }, [monthlyItems]);

  const categoryBreakdown = useMemo(() => {
    const categoryMap = monthlyItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const maxValue = entries[0]?.[1] ?? 1;

    return { entries, maxValue };
  }, [monthlyItems]);

  const topCategory = categoryBreakdown.entries[0]?.[0] ?? "None";
  const nextMonthDisabled = (() => {
    const now = new Date();
    return (
      selectedMonth.getFullYear() === now.getFullYear() &&
      selectedMonth.getMonth() === now.getMonth()
    );
  })();

  // Chart configuration
  const radius = 65;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background dark:bg-background-dark">
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <AppHeader
        title="Analytics"
        eyebrow="Insights"
        onNotificationPress={() => setNotifOpen(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        className="flex-1"
      >
        {/* Month Selector */}
        <View className="px-6 pt-6">
          <View className="flex-row items-center justify-between bg-surface dark:bg-surface-dark rounded-2xl border border-border-muted dark:border-border-dark p-2 shadow-sm">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="h-10 w-10 items-center justify-center rounded-xl bg-surface-muted dark:bg-surface-dark-muted border border-border-muted dark:border-border-dark"
            >
              <ChevronLeft stroke={isDark ? "#cbd5cf" : "#748379"} size={20} strokeWidth={3} />
            </TouchableOpacity>

            <View className="flex-row items-center">
              <CalendarIcon stroke="#59AC77" size={16} strokeWidth={2.5} className="mr-2" />
              <Text className="text-[15px] font-black text-text-primary dark:text-text-dark-primary tracking-tight">
                {formatMonthLabel(selectedMonth)}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={nextMonthDisabled}
              onPress={() => setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className={`h-10 w-10 items-center justify-center rounded-xl bg-surface-muted dark:bg-surface-dark-muted border border-border-muted dark:border-border-dark ${
                nextMonthDisabled ? "opacity-20" : ""
              }`}
            >
              <ChevronRight stroke={isDark ? "#cbd5cf" : "#748379"} size={20} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>

        {monthlyItems.length > 0 ? (
          <>
            {/* Donut Chart */}
            <View className="px-6 pt-10 mb-8 items-center">
              <View className="relative items-center justify-center">
                <Svg width={200} height={200} viewBox="0 0 200 200">
                  <G rotation="-90" origin="100, 100">
                    <Circle
                      cx="100"
                      cy="100"
                      r={radius}
                      stroke={isDark ? "#1a241e" : "#f1f5f2"}
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    {categoryBreakdown.entries.map(([_, count], index) => {
                      const percentage = count / summary.total;
                      const strokeDasharray = `${percentage * circumference} ${circumference}`;
                      const strokeDashoffset = -currentOffset;
                      currentOffset += percentage * circumference;

                      return (
                        <Circle
                          key={index}
                          cx="100"
                          cy="100"
                          r={radius}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={strokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          fill="transparent"
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </G>
                </Svg>
                <View className="absolute items-center justify-center">
                  <Text className="text-[11px] font-bold text-text-muted dark:text-text-dark-muted uppercase tracking-[2px]">
                    Total Items
                  </Text>
                  <Text className="text-[36px] font-black text-text-primary dark:text-text-dark-primary mt-0.5 leading-none">
                    {summary.total}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View className="px-6">
              <Card padding={false} className="overflow-hidden">
                <View className="flex-row border-b border-border-muted dark:border-border-dark">
                  <View className="flex-1 border-r border-border-muted dark:border-border-dark p-5">
                    <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                      Completed
                    </Text>
                    <Text className="mt-1 text-[24px] font-black tracking-tight text-primary-600 dark:text-primary-400">
                      {summary.completed}
                    </Text>
                  </View>
                  <View className="flex-1 p-5">
                    <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                      Pending
                    </Text>
                    <Text className="mt-1 text-[24px] font-black tracking-tight text-text-primary dark:text-text-dark-primary">
                      {summary.pending}
                    </Text>
                  </View>
                </View>
                <View className="flex-row">
                  <View className="flex-1 border-r border-border-muted dark:border-border-dark p-5">
                    <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                      Urgent
                    </Text>
                    <Text className="mt-1 text-[24px] font-black tracking-tight text-red-600">
                      {summary.urgent}
                    </Text>
                  </View>
                  <View className="flex-1 p-5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-text-dark-muted">
                        Completion
                      </Text>
                      <TrendingUp stroke="#59AC77" size={12} strokeWidth={3} />
                    </View>
                    <Text className="mt-1 text-[24px] font-black tracking-tight text-primary-700 dark:text-primary-400">
                      {summary.completionRate}%
                    </Text>
                  </View>
                </View>
              </Card>
            </View>

            {/* Category Breakdown */}
            <View className="px-6 pt-8">
              <Text className="mb-4 text-[18px] font-bold tracking-tight text-text-primary dark:text-text-dark-primary">
                By Category
              </Text>
              <Card padding={false} className="py-2">
                {categoryBreakdown.entries.map(([category, count], index) => {
                  const progress = Math.max(8, Math.round((count / categoryBreakdown.maxValue) * 100));
                  const color = COLORS[index % COLORS.length];
                  const isLast = index === categoryBreakdown.entries.length - 1;

                  return (
                    <View
                      key={category}
                      className={`px-5 py-4 flex-row items-center ${
                        !isLast ? "border-b border-border-muted/40 dark:border-border-dark/40" : ""
                      }`}
                    >
                      <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
                        <View className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      </View>
                      <View className="flex-1">
                        <View className="mb-1.5 flex-row items-center justify-between">
                          <Text className="text-[15px] font-bold text-text-primary dark:text-text-dark-primary">
                            {category}
                          </Text>
                          <Text className="text-[13px] font-bold text-text-muted dark:text-text-dark-muted">
                            {count} {count === 1 ? "item" : "items"}
                          </Text>
                        </View>
                        <View className="h-1.5 rounded-full bg-surface-muted dark:bg-surface-dark-muted overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{ width: `${progress}%`, backgroundColor: color }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </Card>
            </View>

            {/* Insights Card */}
            <View className="px-6 pt-8">
              <Card className="bg-primary-50/50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30 flex-row items-center">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 dark:bg-primary-500 shadow-md">
                  <BarChart3 stroke="white" size={24} strokeWidth={2.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-black text-primary-800 dark:text-primary-300 mb-1">
                    Top Category: {topCategory}
                  </Text>
                  <Text className="text-[12px] font-medium text-primary-700/80 dark:text-primary-400/80 leading-relaxed">
                    Based on your patterns, you purchase {topCategory.toLowerCase()} most frequently.
                  </Text>
                </View>
              </Card>
            </View>
          </>
        ) : (
          <View className="px-6 pt-20 items-center justify-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-surface-muted dark:bg-surface-dark-muted mb-6">
              <BarChart3 stroke={isDark ? "#4f5f56" : "#95a39a"} size={32} strokeWidth={2} />
            </View>
            <Text className="text-[24px] font-black tracking-tight text-text-primary dark:text-text-dark-primary text-center">
              No Data Available
            </Text>
            <Text className="mt-2 text-[15px] leading-6 text-text-muted dark:text-text-dark-muted text-center px-8">
              We couldn't find any items for {formatMonthLabel(selectedMonth)}. Start adding items to see your list insights!
            </Text>
          </View>
        )}
      </ScrollView>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default AnalyzeScreen;
