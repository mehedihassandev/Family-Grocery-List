import React, { useMemo, useState } from "react";
import { AnalyzeStackScreenProps } from "../types";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Calendar as CalendarIcon,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useGroceryList } from "../hooks/queries/useGroceryQueries";
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

/**
 * Helper to convert Firebase Timestamp or Date string to Date object
 * @param value - The timestamp/date value from Firestore
 */
const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value.toDate) return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Formats a date into a Month YYYY label
 * @param date - The date to format
 */
const formatMonthLabel = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

/**
 * Premium Analytics Screen
 * Why: To provide a consistent, high-fidelity experience for tracking grocery habits.
 * Fix: Re-implemented DonutChart using react-native-gifted-charts for stability and animation.
 * Note: Enforces a single light theme.
 */
const AnalyzeScreen = ({ navigation }: AnalyzeStackScreenProps<"Analyze">) => {
  const { user } = useAuthStore();
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // TanStack Query Hook
  const { data: items = [] } = useGroceryList(user?.familyId);

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
  }, [items, selectedMonth]);

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
      <AppHeader title="Analytics" eyebrow="Overview" />

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
            <CalendarIcon size={16} stroke="#3DB87A" className="mr-2" />
            <Text className="text-[17px] font-bold text-text-primary">
              {formatMonthLabel(selectedMonth)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => changeMonth(1)}
            className="h-10 w-10 items-center justify-center rounded-xl bg-white border border-border shadow-xs"
          >
            <ChevronRight size={20} stroke="#4A5568" />
          </TouchableOpacity>
        </View>

        {monthlyItems.length > 0 ? (
          <>
            {/* Main Stats Card with Professional Donut Chart */}
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
                <TrendingUp size={18} stroke="#3DB87A" className="mb-2" />
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
                      color={index === 0 ? "#3DB87A" : index === 1 ? "#4A90D9" : "#F5A623"}
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
              No Data for {formatMonthLabel(selectedMonth)}
            </Text>
            <Text className="text-text-secondary text-center mt-2 leading-6">
              Start adding and completing items to see your family&apos;s shopping trends.
            </Text>
          </View>
        )}
      </ScrollView>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default AnalyzeScreen;
