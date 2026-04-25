import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
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
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  getFamilyDetails,
  subscribeToFamilyMembers,
  joinFamily,
  createFamily,
} from "../services/family";
import { subscribeToGroceryList } from "../services/grocery";
import { Family, GroceryItem } from "../types";
import {
  Card,
  ShortcutCard,
  ProgressBar,
  DonutChart,
  PriorityBadge,
  LoadingOverlay,
  StatusModal,
} from "../components/ui";
import NotificationModal from "../components/NotificationModal";

// Helper to convert Firebase Timestamp or Date string to Date object
const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value.toDate) return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Premium Dashboard Screen
 * Why: To provide a high-fidelity, visually stunning overview of the family's grocery status.
 * Fix: Re-implemented DonutChart using react-native-gifted-charts for stability and animation.
 * Note: Enforces a single light theme.
 */
const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [familyName, setFamilyName] = useState("Our Family");
  const [members, setMembers] = useState<any[]>([]);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isNotifOpen, setNotifOpen] = useState(false);

  // UI State
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (!user?.familyId) return;

    let mounted = true;
    void getFamilyDetails(user.familyId)
      .then((family) => {
        if (!mounted) return;
        const name = (family as Family | undefined)?.name?.trim();
        setFamilyName(name || "Our Family");
      })
      .catch(() => {
        if (mounted) setFamilyName("Our Family");
      });

    return () => {
      mounted = false;
    };
  }, [user?.familyId]);

  useEffect(() => {
    if (!user?.familyId) {
      setMembers([]);
      return;
    }

    const unsubscribe = subscribeToFamilyMembers(
      user.familyId,
      (nextMembers) => setMembers(nextMembers),
      () => setMembers([]),
    );

    return () => unsubscribe();
  }, [user?.familyId]);

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
  }, [pendingItems]);

  const nextItem = recentPending[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.displayName?.split(" ")[0] || "Friend";

  const handleJoinFamily = async () => {
    if (!user || !joinCode.trim()) return;
    setIsLoading(true);
    try {
      const family = await joinFamily(user.uid, joinCode.trim());
      // Update store immediately for instant UI response
      const { setUser } = useAuthStore.getState();
      setUser({ ...user, familyId: family.id, role: "member" });
      
      setStatusModal({
        visible: true,
        title: "Welcome Home!",
        message: `You have successfully joined ${family.name}.`,
        type: "success",
      });
      setJoinCode("");
    } catch (error: any) {
      setStatusModal({
        visible: true,
        title: "Join Failed",
        message: error.message || "Could not join family. Please check the code.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />
      <LoadingOverlay visible={isLoading} />
      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
      />

      {/* Modern Header with Avatar & Notification */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-12 w-12 rounded-2xl bg-primary-600 items-center justify-center overflow-hidden border-2 border-white shadow-sm">
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-white font-bold text-xl">
                {firstName.charAt(0).toUpperCase()}
              </Text>
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
          <View className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-danger-DEFAULT border-2 border-white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        className="flex-1"
      >
        <View className="px-6">
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
                      onPress={() => navigation.navigate("Members")}
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
                            {m.displayName?.charAt(0).toUpperCase()}
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
                <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("List")}>
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
                Join a Family Group
              </Text>
              <Text className="text-text-secondary text-center mt-3 mb-8 px-6 leading-6">
                Collaboration is better! Join your family to share grocery lists and see real-time
                updates.
              </Text>

              <View className="w-full px-4 mb-4">
                <View className="flex-row items-center rounded-[20px] border border-border bg-white px-5 mb-4 shadow-xs">
                  <Users size={18} stroke="#9AA3AF" />
                  <TextInput
                    value={joinCode}
                    onChangeText={setJoinCode}
                    placeholder="INVITE CODE"
                    placeholderTextColor="#C0C8D2"
                    className="h-14 flex-1 ml-3 text-[16px] font-black text-text-primary tracking-[3px] uppercase"
                    autoCapitalize="characters"
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleJoinFamily}
                  activeOpacity={0.8}
                  className="bg-primary-500 w-full py-3 rounded-[20px] items-center shadow-lg shadow-primary-500/25"
                >
                  <View className="flex-row items-center">
                    <Text className="text-white font-bold text-[17px] mr-2">Join Family Group</Text>
                    <ArrowRight size={18} stroke="white" strokeWidth={3} />
                  </View>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center my-6 w-full px-10">
                <View className="h-[1px] flex-1 bg-border/40" />
                <Text className="mx-4 text-text-muted font-black text-[10px] tracking-widest uppercase">
                  OR
                </Text>
                <View className="h-[1px] flex-1 bg-border/40" />
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("CreateFamily")}
                activeOpacity={0.7}
                className="w-[90%] py-3 rounded-2xl items-center border border-primary-500/20 bg-primary-50/20"
              >
                <Text className="text-primary-600 font-bold text-[15px]">Create New Family</Text>
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
                  onPress={() => navigation.navigate("List")}
                  iconBgColor="bg-primary-50/50"
                />
                <ShortcutCard
                  icon={Users}
                  label="Members"
                  onPress={() => navigation.navigate("Members")}
                  iconBgColor="bg-primary-50/50"
                />
                <ShortcutCard
                  icon={BarChart3}
                  label="Analyze"
                  onPress={() => navigation.navigate("Analyze")}
                  iconBgColor="bg-primary-50/50"
                />
                <ShortcutCard
                  icon={UsersRound}
                  label="Profile"
                  onPress={() => navigation.navigate("Profile")}
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
                <TouchableOpacity onPress={() => navigation.navigate("Analyze")}>
                  <Text className="text-primary-500 font-bold text-[13px]">Full Report</Text>
                </TouchableOpacity>
              </View>

              <Card className="bg-surface-alt/50 border-border/30">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-text-primary text-[17px] font-bold">April 2026</Text>
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
                <TouchableOpacity onPress={() => navigation.navigate("List")}>
                  <Text className="text-primary-500 font-bold text-[13px]">View All</Text>
                </TouchableOpacity>
              </View>

              {recentPending.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("List")}
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
                            {item.addedBy.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text className="text-text-muted text-[12px] font-medium">
                          {item.addedBy.name} · 1 day ago
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
