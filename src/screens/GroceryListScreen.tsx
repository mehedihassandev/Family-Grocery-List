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
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
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
  ShoppingBag,
  Camera,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  useFamilyGroceryItemsBackend,
  useToggleItemCompletionBackend,
  useAddGroceryItemBackend,
  useAppTheme,
} from "../hooks";

import ItemCard from "../components/ItemCard";
import EmptyState from "../components/EmptyState";
import { TripSummaryModal } from "../components/TripSummaryModal";
import { sortLegacyGroceryItemsForHome } from "../features/grocery";
import { AppHeader, ProgressBar, OfflineBanner, ScannerModal } from "../components/ui";

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
 * Modern Grocery List Screen
 * Why: Pure white background aesthetic, sleek search bar, and borderless layout.
 */
const GroceryListScreen = ({ navigation }: ListStackScreenProps) => {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [undoState, setUndoState] = useState<IUndoState | null>(null);
  const [summaryModal, setSummaryModal] = useState<{
    visible: boolean;
    items: IGroceryItem[];
    totalSpent: number;
  }>({
    visible: false,
    items: [],
    totalSpent: 0,
  });

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_cart" | "completed">(
    "all",
  );
  const [isRefreshing, setRefreshing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TanStack Query Hooks for Python Backend API
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useFamilyGroceryItemsBackend(user?.familyId);
  const toggleMutation = useToggleItemCompletionBackend(user?.familyId);
  const addItemMutation = useAddGroceryItemBackend(user?.familyId);

  const handleScannedItemAdd = (scanned: {
    name: string;
    category: any;
    quantity: string;
    priority: any;
    estimatedPrice?: number;
  }) => {
    if (!user?.familyId) return;
    addItemMutation.mutate({
      name: scanned.name,
      category: scanned.category,
      quantity: scanned.quantity,
      priority: scanned.priority,
      unitPrice: scanned.estimatedPrice,
      estimatedTotal: scanned.estimatedPrice,
    });
  };

  const listError = queryError ? getDataApiErrorMessage(queryError as Error) : null;

  const sortedItems = useMemo(() => sortLegacyGroceryItemsForHome(items), [items]);

  const isCompletedThisMonth = useCallback((item: IGroceryItem): boolean => {
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
  }, []);

  // Overall Statistics
  const totalCount = items.length;
  const pendingCount = useMemo(() => items.filter((i) => i.status === "pending").length, [items]);
  const inCartCount = useMemo(() => items.filter((i) => i.status === "in_cart").length, [items]);
  const completedCount = useMemo(
    () => items.filter((i) => i.status === "completed").length,
    [items],
  );
  const urgentCount = useMemo(
    () =>
      items.filter(
        (i) => (i.status === "pending" || i.status === "in_cart") && i.priority === "Urgent",
      ).length,
    [items],
  );
  const completionProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sortedItems.filter((item: IGroceryItem) => {
      // Filter by status tab if not 'all'
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchText = [
        item.name,
        item.category,
        item.notes ?? "",
        item.quantity ?? "",
        item.addedBy?.name ?? "",
        item.claimedBy?.name ?? "",
        item.assignee?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [sortedItems, searchQuery, statusFilter]);

  const sections = useMemo<IGrocerySection[]>(() => {
    const pending = filteredItems.filter((item: IGroceryItem) => item.status === "pending");
    const inCart = filteredItems.filter((item: IGroceryItem) => item.status === "in_cart");
    const completedThisMonth = filteredItems.filter(isCompletedThisMonth);
    const output: IGrocerySection[] = [];

    if (inCart.length > 0) {
      output.push({
        key: "in_cart",
        title: "🛒 Currently in Cart",
        data: inCart,
      });
    }

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

    if (completedThisMonth.length > 0 && (showCompleted || statusFilter === "completed")) {
      output.push({
        key: "completed",
        title: "Completed Items",
        data: completedThisMonth,
      });
    }

    return output;
  }, [filteredItems, isCompletedThisMonth, showCompleted, statusFilter]);

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

  const { isDark, colors } = useAppTheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: colors.bgCanvas }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <AppHeader
        title="Grocery List"
        eyebrow="Family Collaboration"
        onNotificationPress={() => (navigation as any).navigate(ROUTES.NOTIFICATIONS)}
      />

      <OfflineBanner onRetry={() => refetch()} />

      <ScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScannedItem={handleScannedItemAdd}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : listError ? (
        <View className="flex-1 items-center justify-center px-8">
          <EmptyState title="Unable to load list" description={listError} />
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.85}
            className="mt-4 flex-row items-center rounded-full px-5 py-3 shadow-md"
            style={{ backgroundColor: colors.accent }}
          >
            <RefreshCw color="white" size={16} strokeWidth={2.4} />
            <Text className="ml-2 text-sm font-bold text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: IGroceryItem) => item.id}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressBackgroundColor={colors.bgSurface}
            />
          }
          contentContainerStyle={{ paddingBottom: 180 }}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.duration(350).springify()} className="px-6 pt-4">
              {/* Flat Clean Summary Line with Breathing Space */}
              <View className="mb-6 pb-2">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <ShoppingBag
                      stroke={colors.accent}
                      size={22}
                      strokeWidth={2.2}
                      className="mr-2.5"
                    />
                    <Text
                      className="text-[18px] font-black tracking-tight"
                      style={{ color: colors.textPrimary }}
                    >
                      {pendingCount === 0
                        ? "All items bought! 🎉"
                        : `${pendingCount} item${pendingCount === 1 ? "" : "s"} remaining`}
                    </Text>
                  </View>
                  {urgentCount > 0 && (
                    <View
                      className="px-3 py-1 rounded-full border"
                      style={{ backgroundColor: colors.dangerLight, borderColor: colors.border }}
                    >
                      <Text className="text-[11px] font-bold" style={{ color: colors.danger }}>
                        {urgentCount} urgent
                      </Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[13px] font-medium" style={{ color: colors.textSecondary }}>
                    {completedCount} of {totalCount} items checked off ({completionProgress}%)
                  </Text>
                </View>
                {totalCount > 0 && (
                  <ProgressBar
                    progress={completionProgress}
                    color={colors.accent}
                    backgroundColor={colors.bgInput}
                    height={5}
                  />
                )}
              </View>

              {/* Minimalist Flat Search Input with Breathing Space & Camera Barcode Scanner */}
              <View className="mb-4 flex-row items-center gap-2">
                <View
                  className="flex-1 flex-row items-center rounded-xl px-4 h-12 border"
                  style={{ backgroundColor: colors.bgInput, borderColor: colors.border }}
                >
                  <Search stroke={colors.accent} size={17} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={SEARCH_PLACEHOLDER}
                    placeholderTextColor={colors.iconMuted}
                    className="ml-2.5 flex-1 text-[14px] font-semibold"
                    style={{
                      color: colors.textPrimary,
                      paddingVertical: 0,
                      height: "100%",
                      textAlignVertical: "center",
                    }}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                      <X stroke={colors.textMuted} size={16} />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => setIsScannerOpen(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Scan barcode or receipt"
                  accessibilityHint="Double tap to open camera scanner"
                  className="h-12 w-12 items-center justify-center rounded-full border shadow-xs"
                  style={{ backgroundColor: colors.accentLightSubtle, borderColor: colors.border }}
                >
                  <Camera stroke={colors.accent} size={20} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>

              {/* Status Filter Pills */}
              <View className="flex-row items-center gap-2 mb-3">
                <TouchableOpacity
                  onPress={() => setStatusFilter("all")}
                  activeOpacity={0.7}
                  className="px-3 py-1.5 rounded-full border"
                  style={
                    statusFilter === "all"
                      ? { backgroundColor: colors.accent, borderColor: colors.accent }
                      : { backgroundColor: colors.bgInput, borderColor: colors.border }
                  }
                >
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: statusFilter === "all" ? colors.white : colors.textSecondary }}
                  >
                    All ({totalCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStatusFilter("pending")}
                  activeOpacity={0.7}
                  className="px-3 py-1.5 rounded-full border"
                  style={
                    statusFilter === "pending"
                      ? { backgroundColor: colors.accent, borderColor: colors.accent }
                      : { backgroundColor: colors.accentLightSubtle, borderColor: colors.border }
                  }
                >
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: statusFilter === "pending" ? colors.white : colors.accent }}
                  >
                    To Buy ({pendingCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStatusFilter("in_cart")}
                  activeOpacity={0.7}
                  className="px-3 py-1.5 rounded-full border"
                  style={
                    statusFilter === "in_cart"
                      ? { backgroundColor: colors.warning, borderColor: colors.warning }
                      : { backgroundColor: colors.warningLight, borderColor: colors.border }
                  }
                >
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: statusFilter === "in_cart" ? colors.white : colors.warning }}
                  >
                    In Cart ({inCartCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStatusFilter("completed")}
                  activeOpacity={0.7}
                  className="px-3 py-1.5 rounded-full border"
                  style={
                    statusFilter === "completed"
                      ? { backgroundColor: colors.textSecondary, borderColor: colors.textSecondary }
                      : { backgroundColor: colors.bgInput, borderColor: colors.border }
                  }
                >
                  <Text
                    className="text-[12px] font-bold"
                    style={{
                      color: statusFilter === "completed" ? colors.white : colors.textSecondary,
                    }}
                  >
                    Bought ({completedCount})
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between mt-2 mb-2">
                <Text
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: colors.textMuted }}
                >
                  Showing {visibleCount} item{visibleCount === 1 ? "" : "s"}
                </Text>
              </View>
            </Animated.View>
          }
          renderSectionHeader={({ section }) => (
            <View
              className="px-6 pb-2 pt-5 flex-row items-center justify-between"
              style={{ backgroundColor: colors.bgCanvas }}
            >
              <View className="flex-row items-center">
                <View
                  className="h-1.5 w-1.5 rounded-full mr-2"
                  style={{ backgroundColor: colors.accent }}
                />
                <Text
                  className="text-[11px] font-extrabold tracking-wider uppercase"
                  style={{ color: colors.textSecondary }}
                >
                  {section.title}
                </Text>
              </View>
              <View
                className="px-2 py-0.5 rounded-full border"
                style={{ backgroundColor: colors.accentLightSubtle, borderColor: colors.border }}
              >
                <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>
                  {section.data.length}
                </Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="px-6">
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
              <View
                className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border"
                style={{ backgroundColor: colors.accentLightSubtle, borderColor: colors.border }}
              >
                <ShoppingBasket stroke={colors.accent} size={28} strokeWidth={2} />
              </View>
              <Text
                className="text-center text-lg font-extrabold tracking-tight"
                style={{ color: colors.textPrimary }}
              >
                No items found
              </Text>
              <Text
                className="mt-1.5 text-center text-xs leading-5"
                style={{ color: colors.textSecondary }}
              >
                {searchQuery
                  ? "Try adjusting your search query."
                  : 'Tap "+" below to add your first grocery item!'}
              </Text>
            </View>
          }
          ListFooterComponent={
            filteredCompletedThisMonthCount > 0 ? (
              <View className="px-5 pt-2">
                <TouchableOpacity
                  onPress={() => setShowCompleted((prev) => !prev)}
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center py-3 rounded-xl border mt-2"
                  style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
                >
                  <Text
                    className="mr-2 text-[12px] font-bold"
                    style={{ color: colors.textSecondary }}
                  >
                    {showCompleted
                      ? "Hide completed items"
                      : `Show completed this month (${filteredCompletedThisMonthCount})`}
                  </Text>
                  {showCompleted ? (
                    <ChevronUp stroke={colors.icon} size={15} strokeWidth={2.5} />
                  ) : (
                    <ChevronDown stroke={colors.icon} size={15} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Industry Standard Bulk Checkout Floating Banner */}
      {inCartCount > 0 && !undoState ? (
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          className="absolute left-5 right-20 flex-row items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 shadow-xl"
          style={{
            bottom: insets.bottom + 12,
            zIndex: 50,
            elevation: 10,
          }}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="h-8 w-8 rounded-full bg-amber-500/20 items-center justify-center mr-2.5">
              <ShoppingBag stroke={colors.warning} size={16} strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-[13px]" numberOfLines={1}>
                {inCartCount} item{inCartCount > 1 ? "s" : ""} in Cart
              </Text>
              <Text className="text-slate-400 font-medium text-[11px]">Ready to finish trip?</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={async () => {
              if (!user?.familyId || !user?.uid) return;
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                const inCartItemsFull = items.filter((i) => i.status === "in_cart");
                const inCartItemsList = inCartItemsFull.map((i) => ({ id: i.id, name: i.name }));
                const calculatedSpent = inCartItemsFull.reduce((acc, item) => {
                  const price = item.actualPrice || item.estimatedTotal || item.unitPrice || 0;
                  return acc + price;
                }, 0);

                const { checkoutCartItems } = await import("../services/grocery");
                await checkoutCartItems(user.familyId, inCartItemsList, {
                  uid: user.uid,
                  name: user.displayName || "Family Member",
                });

                setSummaryModal({
                  visible: true,
                  items: inCartItemsFull,
                  totalSpent: calculatedSpent,
                });
                refetch();
              } catch (err) {
                console.error("Checkout failed:", err);
              }
            }}
            activeOpacity={0.85}
            className="bg-emerald-500 px-3.5 py-2 rounded-xl"
          >
            <Text className="text-white font-extrabold text-[12px]">Checkout</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      {/* Modern Floating Add Item Button */}
      <TouchableOpacity
        onPress={() => (navigation as any).navigate(ROUTES.ADD_ITEM)}
        activeOpacity={0.88}
        className="absolute right-6 h-[54px] w-[54px] overflow-hidden rounded-full shadow-md"
        style={{
          bottom: insets.bottom + 8,
          elevation: 8,
          shadowColor: colors.accent,
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <LinearGradient
          colors={[colors.accent, colors.accentLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-full w-full items-center justify-center"
        >
          <Plus color="white" size={26} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>

      {undoState ? (
        <View
          className="absolute left-5 right-5 flex-row items-center justify-between rounded-xl border px-4 py-3 shadow-lg"
          style={{
            bottom: 20,
            zIndex: 60,
            elevation: 10,
            backgroundColor: colors.bgCard,
            borderColor: colors.accent,
          }}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <CheckCircle2 stroke={colors.accent} size={16} className="mr-2" />
            <Text
              className="flex-1 text-[12px] font-semibold"
              numberOfLines={1}
              style={{ color: colors.textPrimary }}
            >
              {`Marked "${undoState.itemName}" complete`}
            </Text>
          </View>
          <TouchableOpacity onPress={handleUndoComplete} activeOpacity={0.8}>
            <Text
              className="text-[12px] font-bold uppercase tracking-wider"
              style={{ color: colors.accent }}
            >
              Undo
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Trip Cost Summary Modal */}
      <TripSummaryModal
        visible={summaryModal.visible}
        items={summaryModal.items}
        totalSpent={summaryModal.totalSpent}
        onClose={() => setSummaryModal((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

export default GroceryListScreen;
