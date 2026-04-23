import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react-native";
import Svg, { G, Circle } from "react-native-svg";
import { useAuthStore } from "../store/useAuthStore";
import { subscribeToGroceryList } from "../services/grocery";
import { GroceryItem } from "../types";
import { AppHeader, Card } from "../components/ui";
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

const COLORS = ["#59AC77", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];

const toDate = (value: any): Date | null => {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

const formatMonthLabel = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

const AnalyzeScreen = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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

  const topCategory = categoryBreakdown.entries[0]?.[0] ?? "No category yet";
  const nextMonthDisabled = (() => {
    const now = new Date();
    return (
      selectedMonth.getFullYear() === now.getFullYear() &&
      selectedMonth.getMonth() === now.getMonth()
    );
  })();

  // Chart configuration
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      <AppHeader
        title="Analyze"
        eyebrow="Insights"
        onNotificationPress={() => setNotifOpen(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        <View className="px-6 pt-5">
          <View className="flex-row items-center justify-center space-x-4 mb-4">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
              className="mr-3 rounded-full border border-border-muted bg-surface p-2"
            >
              <ChevronLeft stroke="#95a39a" size={20} strokeWidth={2.4} />
            </TouchableOpacity>

            <View className="bg-surface px-6 py-2.5 rounded-full border border-border-muted shadow-sm">
              <Text className="text-[16px] font-bold text-text-primary tracking-wide">
                {formatMonthLabel(selectedMonth)}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={nextMonthDisabled}
              onPress={() =>
                setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              className={`ml-3 rounded-full border border-border-muted bg-surface p-2 ${
                nextMonthDisabled ? "opacity-30" : ""
              }`}
            >
              <ChevronRight stroke="#95a39a" size={20} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>
        </View>

        {monthlyItems.length > 0 && (
          <View className="px-6 pt-4 mb-6 items-center">
            <View className="relative items-center justify-center">
              <Svg width={180} height={180} viewBox="0 0 180 180">
                <G rotation="-90" origin="90, 90">
                  {categoryBreakdown.entries.map(([_, count], index) => {
                    const percentage = count / summary.total;
                    const strokeDasharray = `${percentage * circumference} ${circumference}`;
                    const strokeDashoffset = -currentOffset;
                    currentOffset += percentage * circumference;

                    return (
                      <Circle
                        key={index}
                        cx="90"
                        cy="90"
                        r={radius}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        fill="transparent"
                        strokeLinecap="butt"
                      />
                    );
                  })}
                </G>
              </Svg>
              <View className="absolute items-center justify-center">
                <Text className="text-[12px] font-bold text-text-muted uppercase tracking-widest">
                  Total
                </Text>
                <Text className="text-[32px] font-black text-text-primary mt-0.5">
                  {summary.total}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="px-6">
          <Card className="overflow-hidden">
            <View className="flex-row border-b border-border-muted/60">
              <View className="flex-1 border-r border-border-muted/60 px-5 py-4">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.2px] text-text-muted">
                  Completed
                </Text>
                <Text className="mt-1 text-[22px] font-black tracking-tight text-text-primary">
                  {summary.completed}
                </Text>
              </View>
              <View className="flex-1 px-5 py-4">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.2px] text-text-muted">
                  Pending
                </Text>
                <Text className="mt-1 text-[22px] font-black tracking-tight text-text-primary">
                  {summary.pending}
                </Text>
              </View>
            </View>
            <View className="flex-row">
              <View className="flex-1 border-r border-border-muted/60 px-5 py-4">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.2px] text-text-muted">
                  Urgent
                </Text>
                <Text className="mt-1 text-[22px] font-black tracking-tight text-urgent">
                  {summary.urgent}
                </Text>
              </View>
              <View className="flex-1 px-5 py-4">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.2px] text-text-muted">
                  Completion
                </Text>
                <Text className="mt-1 text-[22px] font-black tracking-tight text-primary-700">
                  {summary.completionRate}%
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View className="px-6 pt-6">
          <Text className="mb-3 text-[18px] font-bold tracking-tight text-text-primary">
            Category Breakdown
          </Text>
          {categoryBreakdown.entries.length === 0 ? (
            <View className="rounded-3xl border border-border-muted bg-surface px-6 py-6 items-center">
              <Text className="text-[14px] text-text-secondary">No items for this month yet.</Text>
            </View>
          ) : (
            <Card className="py-2">
              {categoryBreakdown.entries.map(([category, count], index) => {
                const progress = Math.max(
                  8,
                  Math.round((count / categoryBreakdown.maxValue) * 100),
                );
                const color = COLORS[index % COLORS.length];
                const isLast = index === categoryBreakdown.entries.length - 1;

                return (
                  <View
                    key={category}
                    className={`mx-5 py-4 flex-row items-center ${
                      !isLast ? "border-b border-border-muted/60" : ""
                    }`}
                  >
                    <View
                      className="w-3.5 h-3.5 rounded-md mr-4"
                      style={{ backgroundColor: color }}
                    />
                    <View className="flex-1">
                      <View className="mb-1 flex-row items-center justify-between">
                        <Text className="text-[15px] font-semibold text-text-primary">
                          {category}
                        </Text>
                        <Text className="text-[13px] font-semibold text-text-secondary">
                          {count} item{count === 1 ? "" : "s"}
                        </Text>
                      </View>
                      <View className="h-1.5 rounded-full bg-border-muted/30 overflow-hidden">
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
          )}
        </View>

        <View className="px-6 pt-4">
          <View className="flex-row items-center rounded-2xl border border-border-muted bg-surface px-4 py-4">
            <View className="mr-3 rounded-xl bg-primary-50 p-2.5">
              <BarChart3 stroke="#59AC77" size={18} strokeWidth={2.4} />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-text-primary mb-1">
                Top category: {topCategory}
              </Text>
              <Text className="text-[13px] text-text-muted leading-5">
                Use insights to plan monthly bulk purchases and avoid urgent spikes in spending.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default AnalyzeScreen;
