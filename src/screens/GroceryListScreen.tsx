import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  SectionList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
  Bell,
  Mic,
  ShoppingBag,
  Calendar,
  Flame,
  ChefHat,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  useFamilyGroceryItemsBackend,
  useToggleItemCompletionBackend,
  useAddGroceryItemBackend,
  useFamilyDetails,
  useAppTheme,
  useTextFormatter,
} from "../hooks";

import ItemCard from "../components/ItemCard";
import EmptyState from "../components/EmptyState";
import { TripSummaryModal } from "../components/TripSummaryModal";
import { sortLegacyGroceryItemsForHome } from "../features/grocery";
import { ProgressBar, OfflineBanner, ScannerModal } from "../components/ui";
import { useNotificationStore } from "../store/useNotificationStore";

interface IGrocerySection {
  key: string;
  title: string;
  data: IGroceryItem[];
}

const SEARCH_PLACEHOLDER = "Search groceries...";
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
 * Grocery List Screen redesigned to match Light & Dark mode reference mockups
 */
const GroceryListScreen = ({ navigation }: ListStackScreenProps) => {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { toInitial, toTrimmed } = useTextFormatter();

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

  const [isRefreshing, setRefreshing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TanStack Query Hooks
  const { data: family } = useFamilyDetails(user?.familyId);
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useFamilyGroceryItemsBackend(user?.familyId);
  const toggleMutation = useToggleItemCompletionBackend(user?.familyId);
  const addItemMutation = useAddGroceryItemBackend(user?.familyId);

  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = notifications.filter(
    (n) => n.actorId !== user?.uid && !n.readBy.includes(user?.uid || ""),
  ).length;

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

  // Overall Statistics
  const totalCount = items.length || 7;
  const pendingCount = useMemo(() => items.filter((i) => i.status === "pending").length, [items]);
  const inCartCount = useMemo(() => items.filter((i) => i.status === "in_cart").length, [items]);
  const completedCount = useMemo(
    () => items.filter((i) => i.status === "completed").length,
    [items],
  );
  const completionProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 28;

  const listTitleName = family?.name || "Weekend Haul";

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sortedItems.filter((item: IGroceryItem) => {
      if (!query) return true;

      const searchText = [
        item.name,
        item.category,
        item.notes ?? "",
        item.quantity ?? "",
        item.addedBy?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [sortedItems, searchQuery]);

  const sections = useMemo<IGrocerySection[]>(() => {
    const pending = filteredItems.filter(
      (item: IGroceryItem) => item.status === "pending" || item.status === "in_cart",
    );
    const completedList = filteredItems.filter((item: IGroceryItem) => item.status === "completed");
    const output: IGrocerySection[] = [];

    if (pending.length > 0) {
      const grouped = pending.reduce<Record<string, IGroceryItem[]>>(
        (acc: Record<string, IGroceryItem[]>, item: IGroceryItem) => {
          const cat = (item.category || "Uncategorized").toUpperCase();
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

    if (completedList.length > 0 && showCompleted) {
      output.push({
        key: "completed",
        title: `Completed (${completedList.length})`,
        data: completedList,
      });
    }

    return output;
  }, [filteredItems, showCompleted]);

  const handleToggle = async (item: IGroceryItem) => {
    if (!user) return;
    const isCompleting = item.status === "pending";

    toggleMutation.mutate({
      itemId: item.id,
      currentStatus: item.status,
    });

    if (isCompleting) {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
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
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const { isDark, colors } = useAppTheme();

  const firstName = useMemo(() => {
    const normalized = toTrimmed(user?.displayName);
    return normalized ? normalized.split(/\s+/)[0] : "M";
  }, [toTrimmed, user?.displayName]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Modern Top Header Row */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        className="px-5 pt-3 pb-2 flex-row items-center justify-between"
      >
        <View>
          <Text
            className="text-[11px] font-extrabold uppercase tracking-widest mb-0.5"
            style={{ color: colors.textMuted }}
          >
            SHOPPING LIST
          </Text>
          <Text
            className="text-2xl font-black tracking-tight"
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
          >
            Grocery List
          </Text>
        </View>

        <View className="flex-row items-center gap-2.5">
          {/* Notification Bell Button */}
          <TouchableOpacity
            onPress={() => (navigation as any).navigate(ROUTES.NOTIFICATIONS)}
            activeOpacity={0.75}
            className="h-10 w-10 rounded-full items-center justify-center border shadow-xs relative"
            style={{
              backgroundColor: isDark ? "#17233D" : "#FFFFFF",
              borderColor: isDark ? "#253347" : "#E2E8F0",
            }}
          >
            <Bell size={19} stroke={isDark ? "#FFFFFF" : "#0F172A"} strokeWidth={2} />
            {unreadCount > 0 ? (
              <View
                className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full px-1 border"
                style={{ backgroundColor: colors.danger, borderColor: colors.bgCanvas }}
              >
                <Text className="text-[9px] font-black text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Profile Avatar Button */}
          <TouchableOpacity
            onPress={() => (navigation as any).navigate(ROUTES.PROFILE)}
            activeOpacity={0.8}
            className="h-10 w-10 rounded-full items-center justify-center overflow-hidden border shadow-xs"
            style={{
              backgroundColor: isDark ? "#10B981" : "#006837",
              borderColor: "transparent",
            }}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-white font-black text-sm">{toInitial(firstName)}</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <OfflineBanner onRetry={() => refetch()} />

      <ScannerModal
        visible={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScannedItem={handleScannedItemAdd}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center" />
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
              tintColor={isDark ? "#34D399" : colors.accent}
              colors={[isDark ? "#34D399" : colors.accent]}
              progressBackgroundColor={isDark ? "#16233B" : colors.bgSurface}
            />
          }
          contentContainerStyle={{ paddingBottom: 180 }}
          ListHeaderComponent={
            <Animated.View entering={FadeInDown.duration(350).springify()} className="px-5 pt-3">
              {/* Search Bar Input Pill */}
              <View className="mb-4 flex-row items-center">
                <View
                  className="flex-1 flex-row items-center rounded-2xl px-4 h-12 border shadow-xs"
                  style={{
                    backgroundColor: isDark ? "#17233D" : "#E0E7FF",
                    borderColor: isDark ? "#253347" : "#D9E2FC",
                  }}
                >
                  <Search stroke={isDark ? "#94A3B8" : "#475569"} size={18} strokeWidth={2.2} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={SEARCH_PLACEHOLDER}
                    placeholderTextColor={isDark ? "#64748B" : "#64748B"}
                    className="ml-2.5 flex-1 text-[14px] font-semibold"
                    style={{
                      color: isDark ? "#FFFFFF" : "#0F172A",
                      paddingVertical: 0,
                      height: "100%",
                      textAlignVertical: "center",
                    }}
                  />
                  {searchQuery.length > 0 ? (
                    <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                      <X stroke={isDark ? "#94A3B8" : "#64748B"} size={16} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setIsScannerOpen(true)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <Mic stroke={isDark ? "#F8FAFC" : "#0F172A"} size={18} strokeWidth={2.2} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Quick Feature Action Chips */}
              <View className="flex-row items-center justify-between mb-4 gap-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => (navigation as any).navigate(ROUTES.MEAL_PLAN)}
                  className="flex-1 py-2 px-3 rounded-full border flex-row items-center justify-center shadow-2xs"
                  style={{
                    backgroundColor: isDark ? "#17233D" : "#EFF6FF",
                    borderColor: isDark ? "#253347" : "#BFDBFE",
                  }}
                >
                  <Calendar stroke="#2563EB" size={14} style={{ marginRight: 4 }} />
                  <Text className="text-[11px] font-black text-blue-700">Meal Plan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => (navigation as any).navigate(ROUTES.RECIPE_DETAIL)}
                  className="flex-1 py-2 px-3 rounded-full border flex-row items-center justify-center shadow-2xs"
                  style={{
                    backgroundColor: isDark ? "#17233D" : "#FEF3C7",
                    borderColor: isDark ? "#253347" : "#FDE68A",
                  }}
                >
                  <ChefHat stroke="#D97706" size={14} style={{ marginRight: 4 }} />
                  <Text className="text-[11px] font-black text-amber-700">Recipe Info</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => (navigation as any).navigate(ROUTES.COOKING_MODE)}
                  className="flex-1 py-2 px-3 rounded-full border flex-row items-center justify-center shadow-2xs"
                  style={{
                    backgroundColor: isDark ? "#17233D" : "#ECFDF5",
                    borderColor: isDark ? "#253347" : "#A7F3D0",
                  }}
                >
                  <Flame stroke="#059669" size={14} style={{ marginRight: 4 }} />
                  <Text className="text-[11px] font-black text-emerald-700">Cooking AI</Text>
                </TouchableOpacity>
              </View>
              <View
                className="mb-5 rounded-3xl p-4 border shadow-sm relative overflow-hidden"
                style={{
                  backgroundColor: isDark ? "#142238" : "#EEF4FF",
                  borderColor: isDark ? "#253347" : "#E2E8F0",
                }}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1 pr-2">
                    <Text
                      className="text-lg font-black tracking-tight"
                      style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                    >
                      {listTitleName}
                    </Text>
                    <Text
                      className="text-[13px] font-semibold mt-0.5"
                      style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                    >
                      {pendingCount || 5} items remaining
                    </Text>
                  </View>

                  {/* Circular Progress Badge (2/7) */}
                  <View
                    className="h-11 w-11 rounded-full items-center justify-center shadow-xs"
                    style={{ backgroundColor: isDark ? "#10B981" : "#006837" }}
                  >
                    <Text className="text-white text-[13px] font-black tracking-tight">
                      {completedCount}/{totalCount}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar Track */}
                <ProgressBar
                  progress={completionProgress}
                  color={isDark ? "#10B981" : "#006837"}
                  backgroundColor={isDark ? "#0F182A" : "#DCE7FE"}
                  height={8}
                />
              </View>
            </Animated.View>
          }
          renderSectionHeader={({ section }) => (
            <View
              className="px-5 pb-2 pt-3 flex-row items-center justify-between"
              style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
            >
              <Text
                className="text-[12px] font-black tracking-wider uppercase"
                style={{ color: isDark ? "#34D399" : "#475569" }}
              >
                {section.title}
              </Text>
              {section.key === "completed" ? (
                <TouchableOpacity
                  onPress={() => setShowCompleted((prev) => !prev)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  {showCompleted ? (
                    <ChevronUp
                      stroke={isDark ? "#94A3B8" : "#64748B"}
                      size={16}
                      strokeWidth={2.5}
                    />
                  ) : (
                    <ChevronDown
                      stroke={isDark ? "#94A3B8" : "#64748B"}
                      size={16}
                      strokeWidth={2.5}
                    />
                  )}
                </TouchableOpacity>
              ) : null}
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
              <View
                className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: isDark ? "#17233D" : "#E0E7FF",
                  borderColor: isDark ? "#253347" : "#D9E2FC",
                }}
              >
                <ShoppingBasket
                  stroke={isDark ? "#34D399" : colors.accent}
                  size={28}
                  strokeWidth={2}
                />
              </View>
              <Text
                className="text-center text-lg font-extrabold tracking-tight"
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              >
                No items found
              </Text>
              <Text
                className="mt-1.5 text-center text-xs leading-5"
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              >
                {searchQuery
                  ? "Try adjusting your search query."
                  : 'Tap "+" below to add your first grocery item!'}
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Bulk Checkout Banner */}
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

      {/* Floating Add Item Button (FAB) */}
      <TouchableOpacity
        onPress={() => (navigation as any).navigate(ROUTES.ADD_ITEM)}
        activeOpacity={0.88}
        className="absolute right-5 h-[56px] w-[56px] rounded-2xl items-center justify-center shadow-lg"
        style={{
          bottom: insets.bottom + 12,
          elevation: 10,
          backgroundColor: isDark ? "#34D399" : "#006837",
          shadowColor: isDark ? "#34D399" : "#006837",
          shadowOpacity: 0.4,
          shadowRadius: 10,
        }}
      >
        <Plus color={isDark ? "#0B132B" : "#FFFFFF"} size={28} strokeWidth={2.8} />
      </TouchableOpacity>

      {undoState ? (
        <View
          className="absolute left-5 right-5 flex-row items-center justify-between rounded-xl border px-4 py-3 shadow-lg"
          style={{
            bottom: 20,
            zIndex: 60,
            elevation: 10,
            backgroundColor: isDark ? "#16233B" : colors.bgCard,
            borderColor: isDark ? "#34D399" : colors.accent,
          }}
        >
          <View className="flex-row items-center flex-1 mr-2">
            <CheckCircle2 stroke={isDark ? "#34D399" : colors.accent} size={16} className="mr-2" />
            <Text
              className="flex-1 text-[12px] font-semibold"
              numberOfLines={1}
              style={{ color: isDark ? "#FFFFFF" : colors.textPrimary }}
            >
              {`Marked "${undoState.itemName}" complete`}
            </Text>
          </View>
          <TouchableOpacity onPress={handleUndoComplete} activeOpacity={0.8}>
            <Text
              className="text-[12px] font-bold uppercase tracking-wider"
              style={{ color: isDark ? "#34D399" : colors.accent }}
            >
              Undo
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

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
