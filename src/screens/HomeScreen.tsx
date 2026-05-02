import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
  SectionList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ERootRoutes } from "../navigation/routes";
import {
  Plus,
  RefreshCw,
  Search,
  ShoppingBasket,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  useAddGroceryItem,
  useGroceryList,
  useToggleItemCompletion,
} from "../hooks/queries/useGroceryQueries";
import { IGroceryItem, ListStackScreenProps } from "../types";
import ItemCard from "../components/ItemCard";
import EmptyState from "../components/EmptyState";
import { GROCERY_CATEGORIES, sortLegacyGroceryItemsForHome } from "../features/grocery";
import { AppHeader, Chip } from "../components/ui";
import NotificationModal from "../components/NotificationModal";
import { useTextFormatter } from "../hooks";

type TStatusFilter = "all" | "pending" | "completed";
type TDueFilter = "all" | "overdue" | "due_soon";
type TAssigneeFilter = "all" | "assigned" | "unassigned";

interface IGrocerySection {
  key: string;
  title: string;
  data: IGroceryItem[];
}

const STATUS_FILTERS: { key: TStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
];
const DUE_FILTERS: { key: TDueFilter; label: string }[] = [
  { key: "all", label: "All Due" },
  { key: "overdue", label: "Overdue" },
  { key: "due_soon", label: "Due Soon" },
];
const ASSIGNEE_FILTERS: { key: TAssigneeFilter; label: string }[] = [
  { key: "all", label: "All Assignee" },
  { key: "assigned", label: "Assigned" },
  { key: "unassigned", label: "Unassigned" },
];

const ALL_CATEGORY = "All";
const SEARCH_PLACEHOLDER = "Search items, categories, notes";
const PERMISSION_ERROR_LABEL = "Missing Firestore permission for this query.";
const DEFAULT_QUICK_ADD_CATEGORY = "Other";
const UNDO_DURATION_MS = 5000;

interface IUndoState {
  itemId: string;
  itemName: string;
  familyId: string;
}

/**
 * Maps Firebase error messages to user-friendly strings
 * @param error - The error object from Firestore
 */
const getFirebaseErrorMessage = (error: Error) => {
  const message = error.message || "";
  if (message.includes("permission-denied")) {
    return PERMISSION_ERROR_LABEL;
  }
  if (message.includes("requires an index")) {
    return "Firestore index required. Create index from console link.";
  }
  return "Could not load grocery items. Check internet and retry.";
};

/**
 * Main grocery list screen
 * Why: To allow users to view, search, filter, and manage grocery items in their family list.
 */
const HomeScreen = ({ navigation }: ListStackScreenProps<"List">) => {
  const { user } = useAuthStore();
  const { toTrimmed } = useTextFormatter();
  const insets = useSafeAreaInsets();
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>("pending");
  const [dueFilter, setDueFilter] = useState<TDueFilter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<TAssigneeFilter>("all");
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddQty, setQuickAddQty] = useState("");
  const [quickAddCategory, setQuickAddCategory] = useState(DEFAULT_QUICK_ADD_CATEGORY);
  const [quickAddError, setQuickAddError] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<IUndoState | null>(null);

  const [isNotifOpen, setNotifOpen] = useState(false);

  const [isRefreshing, setRefreshing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isCategoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const categoryAnimation = useRef(new Animated.Value(0)).current;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TanStack Query Hooks
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useGroceryList(user?.familyId);
  const addMutation = useAddGroceryItem();
  const toggleMutation = useToggleItemCompletion();

  const listError = queryError ? getFirebaseErrorMessage(queryError as Error) : null;

  const sortedItems = useMemo(() => sortLegacyGroceryItemsForHome(items), [items]);

  // const viewingItem = useMemo(
  //   () => (viewingItemId ? (items.find((item) => item.id === viewingItemId) ?? null) : null),
  //   [items, viewingItemId],
  // );

  // const editingItem = useMemo(
  //   () => (editingItemId ? (items.find((item) => item.id === editingItemId) ?? null) : null),
  //   [items, editingItemId],
  // );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();
    const dueSoon = new Date();
    dueSoon.setDate(dueSoon.getDate() + 3);

    return sortedItems.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (activeCategory !== ALL_CATEGORY && item.category !== activeCategory) {
        return false;
      }

      if (assigneeFilter === "assigned" && !item.assignee?.name) {
        return false;
      }
      if (assigneeFilter === "unassigned" && item.assignee?.name) {
        return false;
      }

      if (dueFilter !== "all") {
        const dueDate = item.dueDate?.toDate ? item.dueDate.toDate() : item.dueDate;
        if (!(dueDate instanceof Date) || Number.isNaN(dueDate.getTime())) {
          return false;
        }
        if (dueFilter === "overdue" && dueDate >= now) {
          return false;
        }
        if (dueFilter === "due_soon" && (dueDate < now || dueDate > dueSoon)) {
          return false;
        }
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
        item.assignee?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [sortedItems, statusFilter, activeCategory, assigneeFilter, dueFilter, searchQuery]);

  const sections = useMemo<IGrocerySection[]>(() => {
    const pending = filteredItems.filter((item) => item.status === "pending");
    const completed = filteredItems.filter((item) => item.status === "completed");
    const output: IGrocerySection[] = [];

    if (statusFilter !== "completed" && pending.length > 0) {
      const grouped = pending.reduce<Record<string, IGroceryItem[]>>((acc, item) => {
        const cat = item.category || "Uncategorized";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {});

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

    if (
      statusFilter !== "pending" &&
      completed.length > 0 &&
      (statusFilter === "completed" || showCompleted)
    ) {
      output.push({
        key: "completed",
        title: "Completed Items",
        data: completed,
      });
    }

    return output;
  }, [filteredItems, statusFilter, showCompleted]);

  /**
   * Toggles the completion status of a grocery item
   * @param item - The grocery item to toggle
   */
  const handleToggle = async (item: IGroceryItem) => {
    if (!user) return;
    const isCompleting = item.status === "pending";

    toggleMutation.mutate({
      item: {
        id: item.id,
        name: item.name,
        status: item.status,
        familyId: item.familyId,
        category: item.category,
        priority: item.priority,
        notes: item.notes,
        quantity: item.quantity,
        recurrenceFrequency: item.recurrenceFrequency,
        assignee: item.assignee,
        dueDate: item.dueDate,
        unitPrice: item.unitPrice,
        estimatedTotal: item.estimatedTotal,
      },
      user: {
        uid: user.uid,
        name: user.displayName,
      },
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

  const filteredCompletedCount = filteredItems.filter((item) => item.status === "completed").length;
  const visibleCount = filteredItems.length;

  const categoryOptions = useMemo(() => {
    const fromItems = Array.from(new Set(sortedItems.map((item) => item.category).filter(Boolean)));
    const merged = [...GROCERY_CATEGORIES, ...fromItems].filter(
      (category, index, self) => self.indexOf(category) === index,
    );
    return [ALL_CATEGORY, ...merged];
  }, [sortedItems]);

  /**
   * Manually refreshes the list data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleQuickAdd = () => {
    if (!user?.familyId || !user?.uid) return;

    const normalizedName = toTrimmed(quickAddName);
    if (!normalizedName) {
      setQuickAddError("Item name required.");
      return;
    }

    setQuickAddError(null);
    addMutation.mutate(
      {
        familyId: user.familyId,
        item: {
          name: normalizedName,
          quantity: toTrimmed(quickAddQty),
          category: toTrimmed(quickAddCategory) || DEFAULT_QUICK_ADD_CATEGORY,
          priority: "Medium",
        },
        user: {
          uid: user.uid,
          name: user.displayName,
        },
      },
      {
        onSuccess: () => {
          setQuickAddName("");
          setQuickAddQty("");
          setQuickAddError(null);
        },
        onError: (error) => {
          setQuickAddError(error instanceof Error ? error.message : "Could not add item.");
        },
      },
    );
  };

  const handleUndoComplete = () => {
    if (!user || !undoState) return;

    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    toggleMutation.mutate({
      item: {
        id: undoState.itemId,
        name: undoState.itemName,
        status: "completed",
        familyId: undoState.familyId,
      },
      user: {
        uid: user.uid,
        name: user.displayName,
      },
    });
    setUndoState(null);
  };

  useEffect(() => {
    Animated.timing(categoryAnimation, {
      toValue: isCategoryFilterOpen ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isCategoryFilterOpen, categoryAnimation]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const categoryPanelStyle = {
    maxHeight: categoryAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 62],
    }),
    opacity: categoryAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateY: categoryAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-6, 0],
        }),
      },
    ],
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      <AppHeader
        title="Grocery List"
        eyebrow="Family Items"
        onNotificationPress={() => setNotifOpen(true)}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3DB87A" size="large" />
        </View>
      ) : listError ? (
        <View className="flex-1 items-center justify-center px-8">
          <EmptyState title="Unable to load list" description={listError} />
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.85}
            className="mt-4 flex-row items-center rounded-full bg-primary-600 px-5 py-3"
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
              tintColor="#3DB87A"
              colors={["#3DB87A"]}
              progressBackgroundColor="#f8faf8"
            />
          }
          contentContainerStyle={{ paddingBottom: 140 }}
          ListHeaderComponent={
            <View className="px-6 pt-6">
              <View className="mb-6 flex-row items-center rounded-2xl border border-border/50 bg-white px-4 shadow-xs">
                <Search stroke="#9AA3AF" size={20} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={SEARCH_PLACEHOLDER}
                  placeholderTextColor="#C0C8D2"
                  className="ml-3 h-[56px] flex-1 text-[15px] font-bold text-text-primary"
                />
              </View>

              <View className="mb-2 rounded-2xl border border-border/50 bg-white p-2 shadow-xs">
                <View className="flex-row items-center">
                  <TextInput
                    value={quickAddName}
                    onChangeText={(text) => {
                      setQuickAddName(text);
                      if (quickAddError) setQuickAddError(null);
                    }}
                    onSubmitEditing={handleQuickAdd}
                    placeholder="Quick add item"
                    placeholderTextColor="#C0C8D2"
                    className="h-[44px] flex-1 rounded-xl bg-surface px-3 text-[14px] font-semibold text-text-primary"
                    returnKeyType="done"
                  />
                  <TextInput
                    value={quickAddQty}
                    onChangeText={setQuickAddQty}
                    placeholder="Qty"
                    placeholderTextColor="#C0C8D2"
                    className="ml-2 h-[44px] w-16 rounded-xl bg-surface px-2 text-center text-[13px] font-semibold text-text-primary"
                  />
                  <TextInput
                    value={quickAddCategory}
                    onChangeText={setQuickAddCategory}
                    placeholder="Category"
                    placeholderTextColor="#C0C8D2"
                    className="ml-2 h-[44px] w-24 rounded-xl bg-surface px-2 text-[12px] font-semibold text-text-primary"
                  />
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleQuickAdd}
                    disabled={addMutation.isPending}
                    className="ml-2 h-[44px] w-[44px] items-center justify-center rounded-xl bg-primary-600"
                  >
                    {addMutation.isPending ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Plus color="white" size={18} strokeWidth={2.8} />
                    )}
                  </TouchableOpacity>
                </View>
                {quickAddError ? (
                  <Text className="px-1 pt-2 text-[12px] font-medium text-urgent">
                    {quickAddError}
                  </Text>
                ) : null}
              </View>

              <View className="mb-2 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  {STATUS_FILTERS.map((option) => (
                    <Chip
                      key={option.key}
                      label={option.label}
                      selected={statusFilter === option.key}
                      onPress={() => setStatusFilter(option.key)}
                      className="mr-2"
                    />
                  ))}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCategoryFilterOpen((prev) => !prev)}
                  className={`rounded-full border p-2.5 ${
                    isCategoryFilterOpen || activeCategory !== ALL_CATEGORY
                      ? "border-primary-300 bg-primary-50"
                      : "border-border-muted bg-surface"
                  }`}
                >
                  <SlidersHorizontal
                    stroke={
                      isCategoryFilterOpen || activeCategory !== ALL_CATEGORY
                        ? "#3DB87A"
                        : "#748379"
                    }
                    size={18}
                  />
                </TouchableOpacity>
              </View>

              <Animated.View className="overflow-hidden" style={categoryPanelStyle}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2 mt-2"
                  contentContainerStyle={{ paddingRight: 12 }}
                >
                  {categoryOptions.map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      selected={activeCategory === category}
                      onPress={() => setActiveCategory(category)}
                      className="mr-2"
                    />
                  ))}
                </ScrollView>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2"
                  contentContainerStyle={{ paddingRight: 12 }}
                >
                  {DUE_FILTERS.map((option) => (
                    <Chip
                      key={option.key}
                      label={option.label}
                      selected={dueFilter === option.key}
                      onPress={() => setDueFilter(option.key)}
                      className="mr-2"
                    />
                  ))}
                </ScrollView>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2"
                  contentContainerStyle={{ paddingRight: 12 }}
                >
                  {ASSIGNEE_FILTERS.map((option) => (
                    <Chip
                      key={option.key}
                      label={option.label}
                      selected={assigneeFilter === option.key}
                      onPress={() => setAssigneeFilter(option.key)}
                      className="mr-2"
                    />
                  ))}
                </ScrollView>
              </Animated.View>

              <View className="flex-row items-center justify-between mt-4 mb-2">
                <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
                  Showing {visibleCount} item{visibleCount === 1 ? "" : "s"}
                </Text>
              </View>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View className="px-6 pb-2 pt-4 bg-background">
              <Text className="text-[13px] font-bold tracking-widest uppercase text-primary-600">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="px-6">
              <ItemCard
                item={item}
                onToggle={handleToggle}
                onPress={(currentItem) =>
                  navigation.navigate(ERootRoutes.ITEM_DETAIL as any, { itemId: currentItem.id })
                }
                currentUserId={user?.uid}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center px-10 pb-8 pt-16">
              <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary-50">
                <ShoppingBasket stroke="#3DB87A" size={32} strokeWidth={2.2} />
              </View>
              <Text className="text-center text-[28px] font-black tracking-tight text-text-primary">
                No items found
              </Text>
              <Text className="mt-3 text-center text-[16px] leading-6 text-text-muted">
                {searchQuery ||
                activeCategory !== ALL_CATEGORY ||
                dueFilter !== "all" ||
                assigneeFilter !== "all"
                  ? "Try a different search or category filter."
                  : "Tap '+' to add your first grocery item."}
              </Text>
            </View>
          }
          ListFooterComponent={
            statusFilter === "all" && filteredCompletedCount > 0 ? (
              <View className="px-6 pt-2">
                <TouchableOpacity
                  onPress={() => setShowCompleted((prev) => !prev)}
                  activeOpacity={0.8}
                  className="flex-row items-center justify-center py-4 bg-surface rounded-2xl border border-border-muted mt-4"
                >
                  <Text className="mr-2 text-[14px] font-bold text-text-secondary">
                    {showCompleted
                      ? "Hide completed items"
                      : `Show completed (${filteredCompletedCount})`}
                  </Text>
                  {showCompleted ? (
                    <ChevronUp stroke="#637889" size={16} strokeWidth={3} />
                  ) : (
                    <ChevronDown stroke="#637889" size={16} strokeWidth={3} />
                  )}
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate(ERootRoutes.ADD_ITEM)}
        activeOpacity={0.85}
        className="absolute right-6 h-14 w-14 items-center justify-center rounded-2xl bg-primary-600"
        style={{
          bottom: insets.bottom + 78,
          elevation: 8,
          shadowColor: "#3DB87A",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
        }}
      >
        <Plus color="white" size={28} strokeWidth={3} />
      </TouchableOpacity>

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />

      {undoState ? (
        <View
          className="absolute left-6 right-6 flex-row items-center justify-between rounded-2xl border border-primary-100 bg-white px-4 py-3 shadow-lg"
          style={{
            bottom: insets.bottom + 14,
          }}
        >
          <Text
            className="mr-3 flex-1 text-[13px] font-semibold text-text-primary"
            numberOfLines={1}
          >
            {`Marked "${undoState.itemName}" complete`}
          </Text>
          <TouchableOpacity onPress={handleUndoComplete} activeOpacity={0.8}>
            <Text className="text-[13px] font-bold uppercase tracking-wide text-primary-600">
              Undo
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default HomeScreen;
