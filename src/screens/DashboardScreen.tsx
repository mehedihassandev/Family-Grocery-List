import React, { useMemo, useState } from "react";
import { HomeStackScreenProps } from "../types";
import { ScrollView, StatusBar, Text, View, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BarChart3,
  ShoppingBasket,
  Users,
  UsersRound,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useFamilyDetails, useFamilyMembers } from "../hooks/queries/useFamilyQueries";
import { useGroceryList } from "../hooks/queries/useGroceryQueries";
import { useDateFormatter, useTextFormatter } from "../hooks";
import { Card, ShortcutCard, ProgressBar, DonutChart, PriorityBadge } from "../components/ui";
import NotificationModal from "../components/NotificationModal";
import { useNotificationStore } from "../store/useNotificationStore";
import { ERootRoutes, ETabRoutes } from "../navigation/routes";

/**
 * Premium Dashboard Screen
 * Why: To provide a high-fidelity, visually stunning overview of the family's grocery status.
 * Fix: Re-implemented DonutChart using react-native-gifted-charts for stability and animation.
 * Note: Enforces a single light theme.
 */
const DashboardScreen = ({ navigation }: HomeStackScreenProps<"Home">) => {
  const { user } = useAuthStore();
  const { toDate, toRelativeTime, toMonthYear } = useDateFormatter();
  const { toInitial, toTrimmed } = useTextFormatter();
  const [isNotifOpen, setNotifOpen] = useState(false);

  // TanStack Query Hooks
  const { data: family } = useFamilyDetails(user?.familyId);
  const { data: members = [] } = useFamilyMembers(user?.familyId);
  const { data: items = [] } = useGroceryList(user?.familyId);

  const familyName = family?.name || "Our Family";

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
  const hasInvitedMember = members.length > 1;
  const hasAddedItem = totalCount > 0;
  const hasCompletedItem = completedCount > 0;
  const onboardingTasks = useMemo(
    () => [
      {
        id: "invite_member",
        title: "Invite one member",
        done: hasInvitedMember,
        cta: "Open Members",
        onPress: () => navigation.navigate(ETabRoutes.MEMBERS),
      },
      {
        id: "add_item",
        title: "Add first grocery item",
        done: hasAddedItem,
        cta: "Add Item",
        onPress: () => navigation.navigate(ERootRoutes.ADD_ITEM),
      },
      {
        id: "complete_item",
        title: "Mark one item complete",
        done: hasCompletedItem,
        cta: "Open List",
        onPress: () => navigation.navigate(ETabRoutes.LIST),
      },
    ],
    [hasAddedItem, hasCompletedItem, hasInvitedMember, navigation],
  );
  const onboardingDoneCount = onboardingTasks.filter((task) => task.done).length;
  const showOwnerOnboarding =
    user?.role === "owner" && onboardingDoneCount < onboardingTasks.length;
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
      .slice(0, 2); // Show top 2 categories
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
  const currentMonthLabel = useMemo(() => toMonthYear(new Date()), [toMonthYear]);

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
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      {/* Modern Header with Avatar & Notification */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-12 w-12 rounded-2xl bg-primary-600 items-center justify-center overflow-hidden border-2 border-white shadow-sm">
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-white font-bold text-xl">{toInitial(firstName)}</Text>
            )}
          </View>
          <View className="ml-3">
            <Text className="text-text-muted text-[13px] font-medium">{getGreeting()}</Text>
            <Text className="text-text-primary text-[20px] font-bold tracking-tight">
              {user?.displayName} 👋
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setNotifOpen(true)}
          className="h-12 w-12 rounded-2xl bg-white items-center justify-center border border-border shadow-xs"
        >
          <Bell size={22} stroke="#4A5568" />
          {unreadCount > 0 ? (
            <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-surface bg-danger px-1">
              <Text className="text-[9px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="flex-1"
      >
        <View className="px-6">
          {notificationError ? (
            <View className="mb-4 rounded-2xl border border-warning-light bg-warning-light/40 px-4 py-3">
              <View className="flex-row items-start">
                <AlertTriangle size={16} stroke="#F5A623" />
                <Text className="ml-2 flex-1 text-[12px] font-medium leading-5 text-warning-dark">
                  Live activity feed issue: {notificationError}
                </Text>
              </View>
            </View>
          ) : null}

          {user?.familyId ? (
            <>
              {/* Family Group Card */}
              <Card padding={false} className="mb-8 overflow-hidden">
                <View className="h-1.5 w-full bg-primary-500" />
                <View className="p-6">
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-primary-500 text-[11px] font-bold uppercase tracking-[0.1em] mb-1">
                        Family Group
                      </Text>
                      <Text className="text-text-primary text-2xl font-bold tracking-tight">
                        {familyName}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => navigation.navigate(ETabRoutes.MEMBERS)}
                      className="h-11 w-11 rounded-xl bg-primary-50 items-center justify-center border border-primary-100"
                    >
                      <Users size={20} stroke="#3DB87A" />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center mb-6">
                    <View className="flex-row">
                      {members.slice(0, 3).map((m, i) => (
                        <View
                          key={m.uid}
                          className={`h-7 w-7 rounded-full border-2 border-white items-center justify-center ${i > 0 ? "-ml-2" : ""}`}
                          style={{
                            backgroundColor: i === 0 ? "#3DB87A" : i === 1 ? "#4A90D9" : "#F5A623",
                          }}
                        >
                          <Text className="text-white text-[10px] font-bold">
                            {toInitial(m.displayName)}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text className="ml-2 text-text-secondary text-[13px] font-medium">
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </Text>
                  </View>

                  {/* Summary Stats Grid */}
                  <View className="flex-row bg-surface-alt rounded-2xl p-5 border border-border/50">
                    <View className="flex-1 items-center">
                      <Clock size={18} stroke="#4A90D9" className="mb-2" />
                      <Text className="text-2xl font-bold text-text-primary">{pendingCount}</Text>
                      <Text className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        Pending
                      </Text>
                    </View>
                    <View className="w-[1px] bg-border/50 mx-2" />
                    <View className="flex-1 items-center">
                      <CheckCircle2 size={18} stroke="#3DB87A" className="mb-2" />
                      <Text className="text-2xl font-bold text-text-primary">{completedCount}</Text>
                      <Text className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        Done
                      </Text>
                    </View>
                    <View className="w-[1px] bg-border/50 mx-2" />
                    <View className="flex-1 items-center">
                      <AlertCircle size={18} stroke="#E55C5C" className="mb-2" />
                      <Text className="text-2xl font-bold text-text-primary">{urgentCount}</Text>
                      <Text className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        Urgent
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>

              {/* Owner onboarding checklist */}
              {showOwnerOnboarding ? (
                <Card className="mb-8 p-5 border-primary-100 bg-primary-50/20">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-[16px] font-bold text-text-primary">Quick Setup</Text>
                    <Text className="text-[12px] font-bold text-primary-600">
                      {onboardingDoneCount}/{onboardingTasks.length} done
                    </Text>
                  </View>
                  {onboardingTasks.map((task) => (
                    <View
                      key={task.id}
                      className="mb-3 flex-row items-center justify-between rounded-xl border border-border/60 bg-white px-3 py-3"
                    >
                      <View className="mr-3 flex-1 flex-row items-center">
                        <CheckCircle2
                          size={16}
                          stroke={task.done ? "#3DB87A" : "#C0C8D2"}
                          strokeWidth={2}
                        />
                        <Text
                          className={`ml-2 text-[13px] ${task.done ? "font-semibold text-text-secondary" : "font-bold text-text-primary"}`}
                        >
                          {task.title}
                        </Text>
                      </View>
                      {!task.done ? (
                        <TouchableOpacity
                          onPress={task.onPress}
                          className="rounded-lg bg-primary-500 px-3 py-2"
                        >
                          <Text className="text-[11px] font-bold text-white">{task.cta}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                </Card>
              ) : null}

              {/* Shopping Progress Bar */}
              <Card className="mb-8 p-5">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center">
                    <ShoppingBasket size={18} stroke="#3DB87A" />
                    <Text className="ml-2 text-[15px] font-bold text-text-primary">
                      Shopping Progress
                    </Text>
                  </View>
                  <Text className="text-primary-500 font-bold">{completionRate}%</Text>
                </View>
                <ProgressBar progress={completionRate} height={10} />
                <View className="flex-row justify-between mt-1">
                  <Text className="text-[12px] text-text-muted font-medium">
                    {completedCount} of {totalCount} items completed
                  </Text>
                  <Text className="text-[12px] text-warning-dark font-bold">
                    {pendingCount} left to buy
                  </Text>
                </View>
              </Card>

              <Card className="mb-8 p-5 border-primary-100 bg-primary-50/20">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Estimated Spend
                    </Text>
                    <Text className="mt-1 text-[24px] font-bold tracking-tight text-text-primary">
                      ${estimatedSpend.toFixed(2)}
                    </Text>
                  </View>
                  <View className="rounded-xl bg-white px-3 py-2 border border-border/60">
                    <Text className="text-[11px] font-bold text-primary-600">
                      {totalCount} item{totalCount !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Main Stats Card with Professional Donut Chart */}
              <Card className="mb-8">
                <View className="flex-row items-center">
                  <View className="items-center justify-center">
                    <DonutChart
                      total={totalCount}
                      data={[
                        { value: completedCount, color: "#3DB87A" },
                        { value: Math.max(0, pendingCount - urgentCount), color: "#F5A623" },
                        { value: urgentCount, color: "#E55C5C" },
                      ]}
                      size={120}
                      strokeWidth={14}
                    />
                  </View>
                  <View className="ml-8 flex-1">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <View className="h-2.5 w-2.5 rounded-full bg-primary-500 mr-2" />
                        <Text className="text-[14px] font-medium text-text-secondary">
                          Completed
                        </Text>
                      </View>
                      <Text className="text-[14px] font-bold text-text-primary">
                        {completedCount} item{completedCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <View className="h-2.5 w-2.5 rounded-full bg-warning-DEFAULT mr-2" />
                        <Text className="text-[14px] font-medium text-text-secondary">Pending</Text>
                      </View>
                      <Text className="text-[14px] font-bold text-text-primary">
                        {pendingCount} item{pendingCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="h-2.5 w-2.5 rounded-full bg-danger-DEFAULT mr-2" />
                        <Text className="text-[14px] font-medium text-text-secondary">Urgent</Text>
                      </View>
                      <Text className="text-[14px] font-bold text-text-primary">
                        {urgentCount} item{urgentCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="h-[1px] bg-border/50 my-6" />

                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-[0.1em] mb-5">
                  By Category
                </Text>
                {categoryStats.map(([cat, count]) => (
                  <ProgressBar
                    key={cat}
                    label={cat}
                    progress={(count / (totalCount || 1)) * 100}
                    color={cat === "Beauty" ? "#3DB87A" : "#F5A623"}
                    height={6}
                  />
                ))}
              </Card>

              {/* Up Next Card */}
              {nextItem && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate(ETabRoutes.LIST)}
                >
                  <Card className="mb-8 border-primary-100 bg-primary-50/20 p-4 border-2">
                    <View className="flex-row items-center">
                      <View className="h-12 w-12 rounded-xl bg-primary-100 items-center justify-center">
                        <ArrowRight size={22} stroke="#3DB87A" />
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className="text-primary-500 text-[10px] font-black uppercase tracking-wider mb-0.5">
                          Up Next
                        </Text>
                        <Text className="text-text-primary text-[17px] font-bold leading-tight">
                          {nextItem.name} —{" "}
                          <Text className="text-text-secondary font-medium">
                            {nextItem.category}
                          </Text>
                        </Text>
                        <Text className="text-text-muted text-[12px] mt-1 font-medium">
                          Added by {nextItem.addedBy.name}
                        </Text>
                      </View>
                      <PriorityBadge priority={nextItem.priority} />
                    </View>
                  </Card>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Card className="mb-8 py-10 items-center">
              <View className="h-20 w-20 rounded-3xl bg-primary-50 items-center justify-center mb-6">
                <UsersRound size={40} stroke="#3DB87A" strokeWidth={1.5} />
              </View>
              <Text className="text-2xl font-bold text-text-primary text-center px-4 tracking-tight">
                Set Up Your Family
              </Text>
              <Text className="text-text-secondary text-center mt-3 mb-8 px-6 leading-6">
                Use one setup flow to create or join family, then unlock list, members, analytics.
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate(ERootRoutes.FAMILY_SETUP)}
                activeOpacity={0.8}
                className="w-[90%] rounded-2xl bg-primary-500 py-3 items-center"
              >
                <Text className="text-white font-bold text-[15px]">Continue Setup</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Shortcuts - Only show if in a family to avoid navigation crashes */}
          {user?.familyId && (
            <View className="mb-10">
              <Text className="text-text-primary text-[18px] font-bold tracking-tight mb-5">
                Shortcuts
              </Text>
              <View className="flex-row justify-between bg-white rounded-[32px] p-6 border border-border shadow-sm">
                <ShortcutCard
                  icon={ShoppingBasket}
                  label="List"
                  onPress={() => navigation.navigate(ETabRoutes.LIST)}
                  iconBgColor="bg-primary-50/50"
                />
                <ShortcutCard
                  icon={Users}
                  label="Members"
                  onPress={() => navigation.navigate(ETabRoutes.MEMBERS)}
                  iconBgColor="bg-primary-50/50"
                />
                <ShortcutCard
                  icon={BarChart3}
                  label="Analyze"
                  onPress={() => navigation.navigate(ETabRoutes.ANALYZE)}
                  iconBgColor="bg-primary-50/50"
                />
                <ShortcutCard
                  icon={UsersRound}
                  label="Profile"
                  onPress={() => navigation.navigate(ETabRoutes.PROFILE)}
                  iconBgColor="bg-primary-50/50"
                />
              </View>
            </View>
          )}

          {/* Analytics Overview Section */}
          {user?.familyId && (
            <View className="mb-10">
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-text-primary text-[18px] font-bold tracking-tight">
                  Analytics Overview
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate(ETabRoutes.ANALYZE)}>
                  <Text className="text-primary-500 font-bold text-[13px]">Full Report</Text>
                </TouchableOpacity>
              </View>

              <Card className="bg-surface-alt/50 border-border/30">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-text-primary text-[17px] font-bold">
                    {currentMonthLabel}
                  </Text>
                  <View className="bg-white px-3 py-1.5 rounded-lg border border-border shadow-xs flex-row items-center">
                    <Text className="text-text-secondary text-[12px] font-bold">This month</Text>
                  </View>
                </View>

                <View className="flex-row gap-4 mb-4">
                  <View className="flex-1 bg-white p-4 rounded-2xl border border-border/50 shadow-xs">
                    <Text className="text-2xl font-bold text-text-primary">{totalCount}</Text>
                    <Text className="text-[10px] font-bold text-text-muted uppercase mt-1">
                      Total Items
                    </Text>
                  </View>
                  <View className="flex-1 bg-white p-4 rounded-2xl border border-border/50 shadow-xs flex-row justify-between">
                    <View>
                      <Text className="text-2xl font-bold text-text-primary">{completedCount}</Text>
                      <Text className="text-[10px] font-bold text-text-muted uppercase mt-1">
                        Completed
                      </Text>
                    </View>
                    <CheckCircle2 size={16} stroke="#3DB87A" />
                  </View>
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1 bg-white p-4 rounded-2xl border border-border/50 shadow-xs flex-row justify-between">
                    <View>
                      <Text className="text-2xl font-bold text-text-primary">{pendingCount}</Text>
                      <Text className="text-[10px] font-bold text-text-muted uppercase mt-1">
                        Pending
                      </Text>
                    </View>
                    <Clock size={16} stroke="#F5A623" />
                  </View>
                  <View className="flex-1 bg-white p-4 rounded-2xl border border-border/50 shadow-xs flex-row justify-between">
                    <View>
                      <Text className="text-2xl font-bold text-text-primary">
                        {completionRate}%
                      </Text>
                      <Text className="text-[10px] font-bold text-text-muted uppercase mt-1">
                        Completion
                      </Text>
                    </View>
                    <TrendingUp size={16} stroke="#3DB87A" />
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Recent Pending */}
          {user?.familyId && recentPending.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-text-primary text-[18px] font-bold tracking-tight">
                  Recent Pending
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate(ETabRoutes.LIST)}>
                  <Text className="text-primary-500 font-bold text-[13px]">View All</Text>
                </TouchableOpacity>
              </View>

              {recentPending.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate(ETabRoutes.LIST)}
                  className="mb-4"
                >
                  <Card padding={false} className="flex-row overflow-hidden min-h-[96px]">
                    <View
                      style={{
                        width: 5,
                        backgroundColor:
                          item.priority === "Urgent"
                            ? "#E55C5C"
                            : item.priority === "Medium"
                              ? "#F5A623"
                              : "#3DB87A",
                      }}
                    />
                    <View className="flex-1 p-5 justify-center">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text
                            className="text-[17px] font-bold text-text-primary mb-1"
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <View className="flex-row items-center">
                            <View className="h-2 w-2 rounded-full bg-primary-500 mr-2" />
                            <Text className="text-text-secondary text-[13px] font-medium">
                              {item.category} {item.quantity ? `· qty ${item.quantity}` : ""}
                            </Text>
                          </View>
                        </View>
                        <PriorityBadge priority={item.priority} />
                      </View>

                      <View className="flex-row items-center mt-4">
                        <View className="h-6 w-6 rounded-full bg-primary-600 items-center justify-center mr-2">
                          <Text className="text-white text-[10px] font-bold">
                            {toInitial(item.addedBy.name)}
                          </Text>
                        </View>
                        <Text className="text-text-muted text-[12px] font-medium">
                          {item.addedBy.name} · {toRelativeTime(item.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default DashboardScreen;
