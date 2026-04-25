import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { subscribeToGroceryList } from "../services/grocery";
import { GroceryItem } from "../types";
import { AppHeader, Card, DonutChart, ProgressBar } from "../components/ui";
import NotificationModal from "../components/NotificationModal";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const toDate = (value: any): Date | null => {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

const formatMonthLabel = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

/**
 * Premium Analytics Screen
 * Why: To provide a consistent, high-fidelity experience for tracking grocery habits.
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

    return Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  }, [monthlyItems]);

  const topCategory = categoryBreakdown[0]?.[0] ?? "None";

  const nextMonthDisabled = (() => {
    const now = new Date();
    return (
      selectedMonth.getFullYear() === now.getFullYear() &&
      selectedMonth.getMonth() === now.getMonth()
    );
  })();

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

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
          <View className="flex-row items-center justify-between bg-white rounded-3xl border border-border p-2 shadow-sm">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
              className="h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted border border-border"
            >
              <ChevronLeft stroke="#4A5568" size={20} strokeWidth={3} />
            </TouchableOpacity>

            <View className="flex-row items-center">
              <CalendarIcon stroke="#3DB87A" size={18} strokeWidth={2.5} className="mr-2" />
              <Text className="text-[17px] font-bold text-text-primary tracking-tight">
                {formatMonthLabel(selectedMonth)}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={nextMonthDisabled}
              onPress={() =>
                setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              className={`h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted border border-border ${
                nextMonthDisabled ? "opacity-20" : ""
              }`}
            >
              <ChevronRight stroke="#4A5568" size={20} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>

        {monthlyItems.length > 0 ? (
          <>
            {/* Main Stats Card */}
            <View className="px-6 pt-8">
              <Card className="mb-8 items-center py-10">
                <DonutChart
                  total={summary.total}
                  data={[
                    { value: summary.completed, color: "#3DB87A" },
                    { value: Math.max(0, summary.pending - summary.urgent), color: "#F5A623" },
                    { value: summary.urgent, color: "#E55C5C" },
                  ]}
                  size={160}
                  strokeWidth={16}
                />

                <View className="mt-10 flex-row flex-wrap justify-center gap-6">
                  <View className="flex-row items-center">
                    <View className="h-3 w-3 rounded-full bg-primary-500 mr-2" />
                    <Text className="text-[14px] font-bold text-text-secondary">Completed</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="h-3 w-3 rounded-full bg-warning-DEFAULT mr-2" />
                    <Text className="text-[14px] font-bold text-text-secondary">Pending</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="h-3 w-3 rounded-full bg-danger-DEFAULT mr-2" />
                    <Text className="text-[14px] font-bold text-text-secondary">Urgent</Text>
                  </View>
                </View>
              </Card>

              {/* Stats Grid */}
              <View className="flex-row gap-4 mb-8">
                <View className="flex-1 bg-white p-5 rounded-[24px] border border-border shadow-xs flex-row justify-between">
                  <View>
                    <Text className="text-2xl font-bold text-text-primary">
                      {summary.completed}
                    </Text>
                    <Text className="text-[10px] font-bold text-text-muted uppercase mt-1">
                      Completed
                    </Text>
                  </View>
                  <CheckCircle2 size={16} stroke="#3DB87A" />
                </View>
                <View className="flex-1 bg-white p-5 rounded-[24px] border border-border shadow-xs flex-row justify-between">
                  <View>
                    <Text className="text-2xl font-bold text-text-primary">
                      {summary.completionRate}%
                    </Text>
                    <Text className="text-[10px] font-bold text-text-muted uppercase mt-1">
                      Completion
                    </Text>
                  </View>
                  <TrendingUp size={16} stroke="#3DB87A" />
                </View>
              </View>
            </View>

            {/* Category Breakdown */}
            <View className="px-6">
              <Text className="mb-5 text-[18px] font-bold tracking-tight text-text-primary">
                By Category
              </Text>
              <Card className="mb-8">
                {categoryBreakdown.map(([category, count], index) => (
                  <ProgressBar
                    key={category}
                    label={category}
                    progress={(count / (summary.total || 1)) * 100}
                    color={index % 2 === 0 ? "#3DB87A" : "#F5A623"}
                    height={8}
                    showPercentage
                  />
                ))}
              </Card>
            </View>

            {/* Insights Card */}
            <View className="px-6">
              <Card className="bg-primary-500/5 border-primary-500/20 flex-row items-center p-6">
                <View className="h-14 w-14 rounded-2xl bg-primary-500 items-center justify-center shadow-lg shadow-primary-500/20">
                  <BarChart3 stroke="white" size={26} strokeWidth={2.5} />
                </View>
                <View className="ml-5 flex-1">
                  <Text className="text-[15px] font-bold text-text-primary mb-1">
                    Top Pattern: {topCategory}
                  </Text>
                  <Text className="text-[13px] font-medium text-text-secondary leading-relaxed">
                    You&apos;ve added {summary.total} items this month. {topCategory} is your most
                    frequent category.
                  </Text>
                </View>
              </Card>
            </View>
          </>
        ) : (
          <View className="px-6 pt-32 items-center justify-center">
            <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-surface-muted mb-6">
              <BarChart3 stroke="#9AA3AF" size={40} strokeWidth={1.5} />
            </View>
            <Text className="text-[22px] font-bold text-text-primary text-center tracking-tight">
              No Insights Yet
            </Text>
            <Text className="mt-3 text-[15px] leading-6 text-text-muted text-center px-10">
              {"Add items to your list for "}
              {formatMonthLabel(selectedMonth)}
              {" to see how your family shops."}
            </Text>
          </View>
        )}
      </ScrollView>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default AnalyzeScreen;
