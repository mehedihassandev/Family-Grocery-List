import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { IGroceryItem, ListStackScreenProps, ROUTES } from "../types";

import {
  Plus,
  RefreshCw,
  Search,
  ShoppingBasket,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useFamilyGroceryItemsBackend, useToggleItemCompletionBackend } from "../hooks";

import ItemCard from "../components/ItemCard";
import EmptyState from "../components/EmptyState";
import { sortLegacyGroceryItemsForHome } from "../features/grocery";
import { AppHeader, ProgressBar } from "../components/ui";

interface IGrocerySection {
  key: string;
  title: string;
  data: IGroceryItem[];
}

const SEARCH_PLACEHOLDER = "Search items, categories, notes...";
const UNDO_DURATION_MS = 5000;

interface IUndoState {
  itemId: string;
  itemName: string;
  familyId: string;
}

/**
 * Maps Data API error messages to user-friendly strings
 */
const getDataApiErrorMessage = (error: Error) => {
  const message = error.message || "";
  if (message.includes("status 500")) {
    return "Backend server error (500). Please check backend deployment.";
  }
  if (message.includes("401") || message.includes("403")) {
    return "Authentication failed. Please sign in again.";
  }
  return message || "Could not load grocery items. Check internet and retry.";
};

/**
 * Main grocery list screen
 * Why: To allow users to view, search, filter, and manage grocery items in their family list via Python backend API with a modern glassmorphic interface.
 */
const GroceryListScreen = ({ navigation, onTabChange }: ListStackScreenProps) => {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [undoState, setUndoState] = useState<IUndoState | null>(null);

  const [isRefreshing, setRefreshing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TanStack Query Hooks for Python Backend API
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useFamilyGroceryItemsBackend(user?.familyId);
  const toggleMutation = useToggleItemCompletionBackend(user?.familyId);

  const listError = queryError ? getDataApiErrorMessage(queryError as Error) : null;

  const sortedItems = useMemo(() => sortLegacyGroceryItemsForHome(items), [items]);

  /**
   * Checks if a completed item was completed within the past 30 days (from today to 30 days back)
   * Note: toTimestampMs is defined inline here — it has no external deps so moving it
   * inside the callback is the recommended React fix to avoid a new reference each render.
   */
  const isCompletedThisMonth = useCallback(
    (item: IGroceryItem): boolean => {
      const toTimestampMs = (value: unknown): number | null => {
        if (!value) return null;
        if (value instanceof Date) {
          const t = value.getTime();
          return Number.isNaN(t) ? null : t;
        }
        if (typeof value === "number") {
          if (Number.isNaN(value)) return null;
          return value > 1e11 ? value : value * 1000;
        }
        if (typeof value === "string") {
          const parsed = new Date(value).getTime();
          if (!Number.isNaN(parsed)) return parsed;
        }
        if (typeof value === "object") {
          const obj = value as any;
          if (typeof obj.toMillis === "function") {
            const ms = obj.toMillis();
            return typeof ms === "number" && !Number.isNaN(ms) ? ms : null;
          }
          const seconds = obj.seconds ?? obj._seconds;
          if (typeof seconds === "number") {
            const nanos = obj.nanoseconds ?? obj._nanoseconds ?? 0;
            return seconds * 1000 + Math.floor(nanos / 1_000_000);
          }
        }
        return null;
      };

      if (item.status !== "completed") return false;
      const timestampMs =
        toTimestampMs(item.completedAt) ??
        toTimestampMs(item.updatedAt) ??
        toTimestampMs(item.createdAt);

      if (timestampMs === null) return false;

      const now = Date.now();
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      return timestampMs >= now - THIRTY_DAYS_MS && timestampMs <= now + 60000;
    },
    [], // no external deps — toTimestampMs is pure and inlined above
  );

  // Overall Statistics
  const totalCount = items.length;
  const pendingCount = useMemo(() => items.filter((i) => i.status === "pending").length, [items]);
  const completedCount = useMemo(
    () => items.filter((i) => i.status === "completed").length,
    [items],
  );
  const urgentCount = useMemo(
    () => items.filter((i) => i.status === "pending" && i.priority === "Urgent").length,
    [items],
  );
  const completionProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sortedItems.filter((item: IGroceryItem) => {
      if (!query) {
        return true;
      }

      const searchText = [
        item.name,
        item.category,
        item.notes ?? "",
        item.quantity ?? "",
        item.addedBy?.name ?? "",
        item.assignee?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [sortedItems, searchQuery]);

  const sections = useMemo<IGrocerySection[]>(() => {
    const pending = filteredItems.filter((item: IGroceryItem) => item.status === "pending");
    const completedThisMonth = filteredItems.filter(isCompletedThisMonth);
    const output: IGrocerySection[] = [];

    if (pending.length > 0) {
      const grouped = pending.reduce<Record<string, IGroceryItem[]>>(
        (acc: Record<string, IGroceryItem[]>, item: IGroceryItem) => {
          const cat = item.category || "Uncategorized";
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(item);
          return acc;
        },
        {},
      );

      Object.keys(grouped)
        .sort()
        .forEach((cat) => {
          output.push({
            key: `pending-${cat}`,
            title: cat,
            data: grouped[cat],
          });
        });
    }

    if (completedThisMonth.length > 0 && showCompleted) {
      output.push({
        key: "completed",
        title: "Completed Items (This Month)",
        data: completedThisMonth,
      });
    }

    return output;
  }, [filteredItems, isCompletedThisMonth, showCompleted]);

  /**
   * Toggles the completion status of a grocery item
   * @param item - The grocery item to toggle
   */
  const handleToggle = async (item: IGroceryItem) => {
    if (!user) return;
    const isCompleting = item.status === "pending";

    toggleMutation.mutate({
      itemId: item.id,
      currentStatus: item.status,
    });

    if (isCompleting) {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }

      setUndoState({
        itemId: item.id,
        itemName: item.name,
        familyId: item.familyId,
      });

      undoTimerRef.current = setTimeout(() => {
        setUndoState(null);
        undoTimerRef.current = null;
      }, UNDO_DURATION_MS);
    } else {
      setUndoState(null);
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    }
  };

  const filteredCompletedThisMonthCount = useMemo(
    () => filteredItems.filter(isCompletedThisMonth).length,
    [filteredItems, isCompletedThisMonth],
  );
  const visibleCount = filteredItems.length;

  /**
   * Manually refreshes the list data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleUndoComplete = () => {
    if (!user || !undoState) return;

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    toggleMutation.mutate({
      itemId: undoState.itemId,
      currentStatus: "completed",
    });
    setUndoState(null);
  };

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      <AppHeader
        title="Grocery List"
        eyebrow="Family Collaboration"
        onNotificationPress={() => (navigation as any).navigate(ROUTES.NOTIFICATIONS)}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#059669" size="large" />
        </View>
      ) : listError ? (
        <View className="flex-1 items-center justify-center px-8">
          <EmptyState title="Unable to load list" description={listError} />
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.85}
            className="mt-4 flex-row items-center rounded-full bg-emerald-600 px-5 py-3 shadow-md shadow-emerald-600/30"
          >
            <RefreshCw color="white" size={16} strokeWidth={2.4} />
            <Text className="ml-2 text-sm font-semibold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#059669"
              colors={["#059669"]}
              progressBackgroundColor="#f8faf8"
            />
          }
          contentContainerStyle={{ paddingBottom: 160 }}
          ListHeaderComponent={
            <View className="px-5 pt-4">
              {/* Vibrant Linear Gradient Hero Banner */}
              <View className="mb-5 overflow-hidden rounded-3xl shadow-md shadow-emerald-900/20">
                <LinearGradient
                  colors={["#064E3B", "#059669", "#10B981"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-4"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="h-10 w-10 rounded-2xl bg-white/15 border border-white/25 items-center justify-center mr-3">
                        <ShoppingBag stroke="#FFFFFF" size={20} strokeWidth={2.2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[17px] font-extrabold text-white tracking-tight">
                          {pendingCount === 0
                            ? "All items bought! 🎉"
                            : `${pendingCount} item${pendingCount === 1 ? "" : "s"} remaining`}
                        </Text>
                        <Text className="text-[12px] font-medium text-emerald-100/90 mt-0.5">
                          {completedCount} of {totalCount} items checked off
                        </Text>
                      </View>
                    </View>
                    {urgentCount > 0 && (
                      <View className="flex-row items-center bg-rose-500/25 px-2.5 py-1 rounded-full border border-rose-300/40">
                        <AlertCircle stroke="#FECDD3" size={12} className="mr-1" />
                        <Text className="text-[11px] font-bold text-white">
                          {urgentCount} urgent
                        </Text>
                      </View>
                    )}
                  </View>

                  {totalCount > 0 && (
                    <View className="mt-1">
                      <ProgressBar
                        progress={completionProgress}
                        color="#FFFFFF"
                        backgroundColor="rgba(255, 255, 255, 0.2)"
                        height={8}
                      />
                    </View>
                  )}
                </LinearGradient>
              </View>

              {/* Glassmorphic Search Bar */}
              <View className="mb-4 flex-row items-center rounded-2xl border border-slate-200/90 bg-white/95 px-3.5 shadow-xs">
                <Search stroke="#059669" size={18} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={SEARCH_PLACEHOLDER}
                  placeholderTextColor="#94A3B8"
                  className="ml-2.5 h-[50px] flex-1 text-[14px] font-semibold text-slate-900"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                    <X stroke="#94A3B8" size={18} />
                  </TouchableOpacity>
                )}
              </View>

              <View className="flex-row items-center justify-between mt-3 mb-2">
                <Text className="text-[11px] font-bold uppercase tracking-[1.2px] text-slate-400">
                  Showing {visibleCount} item{visibleCount === 1 ? "" : "s"}
                </Text>
              </View>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View className="px-5 pb-2 pt-3 bg-background flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                <Text className="text-[12px] font-extrabold tracking-wider uppercase text-slate-700">
                  {section.title}
                </Text>
              </View>
              <View className="bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Text className="text-[10px] font-bold text-emerald-800">
                  {section.data.length}
                </Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="px-5">
              <ItemCard
                item={item}
                onToggle={handleToggle}
                onPress={(currentItem) =>
                  (navigation as any).navigate(ROUTES.ITEM_DETAIL, { itemId: currentItem.id })
                }
                currentUserId={user?.uid}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center px-10 pb-8 pt-12">
              <View className="mb-5 h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 border border-emerald-100 shadow-xs">
                <ShoppingBasket stroke="#059669" size={34} strokeWidth={2} />
              </View>
              <Text className="text-center text-[22px] font-extrabold tracking-tight text-slate-900">
                No items found
              </Text>
              <Text className="mt-2 text-center text-[14px] leading-5 text-slate-500">
                {searchQuery
                  ? "Try adjusting your search query."
                  : 'Tap "Add Items" below to add your first grocery item!'}
              </Text>
            </View>
          }
          ListFooterComponent={
            filteredCompletedThisMonthCount > 0 ? (
              <View className="px-5 pt-2">
                <TouchableOpacity
                  onPress={() => setShowCompleted((prev) => !prev)}
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center py-3.5 bg-white rounded-2xl border border-slate-200/90 mt-3 shadow-xs"
                >
                  <Text className="mr-2 text-[13px] font-bold text-slate-700">
                    {showCompleted
                      ? "Hide completed items"
                      : `Show completed this month (${filteredCompletedThisMonthCount})`}
                  </Text>
                  {showCompleted ? (
                    <ChevronUp stroke="#64748B" size={16} strokeWidth={2.5} />
                  ) : (
                    <ChevronDown stroke="#64748B" size={16} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Vibrant Linear Gradient Floating Add Items Pill Button */}
      <TouchableOpacity
        onPress={() => (navigation as any).navigate(ROUTES.ADD_ITEM)}
        activeOpacity={0.85}
        className="absolute right-6 h-[60px] w-[60px] overflow-hidden rounded-2xl shadow-lg"
        style={{
          bottom: insets.bottom,
          elevation: 10,
          shadowColor: "#059669",
          shadowOpacity: 0.35,
          shadowRadius: 10,
        }}
      >
        <LinearGradient
          colors={["#059669", "#10B981"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-full w-full items-center justify-center"
        >
          <Plus color="white" size={28} strokeWidth={2.8} />
        </LinearGradient>
      </TouchableOpacity>

      {undoState ? (
        <View
          className="absolute left-5 right-5 flex-row items-center justify-between rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl"
          style={{
            bottom: 20,
            zIndex: 60,
            elevation: 12,
          }}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <CheckCircle2 stroke="#059669" size={18} className="mr-2" />
            <Text className="flex-1 text-[13px] font-semibold text-slate-900" numberOfLines={1}>
              {`Marked "${undoState.itemName}" complete`}
            </Text>
          </View>
          <TouchableOpacity onPress={handleUndoComplete} activeOpacity={0.8}>
            <Text className="text-[13px] font-bold uppercase tracking-wider text-emerald-600">
              Undo
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default GroceryListScreen;
