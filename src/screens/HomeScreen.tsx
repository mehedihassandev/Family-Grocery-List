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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Plus,
  RefreshCw,
  Search,
  Users,
  ShoppingBasket,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  subscribeToGroceryList,
  toggleItemCompletion,
} from "../services/grocery";
import { Family, GroceryItem } from "../types";
import ItemCard from "../components/ItemCard";
import AddItemModal from "../components/AddItemModal";
import EditItemModal from "../components/EditItemModal";
import EmptyState from "../components/EmptyState";
import {
  GROCERY_CATEGORIES,
  sortLegacyGroceryItemsForHome,
} from "../features/grocery";
import { getFamilyDetails, subscribeToFamilyMembers } from "../services/family";

type StatusFilter = "all" | "pending" | "completed";

type GrocerySection = {
  key: string;
  title: string;
  data: GroceryItem[];
};

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
];

const ALL_CATEGORY = "All";
const SEARCH_PLACEHOLDER = "Search items, categories, notes";
const PERMISSION_ERROR_LABEL = "Missing Firestore permission for this query.";
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

const HomeScreen = () => {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [familyName, setFamilyName] = useState("Our Family");
  const [listError, setListError] = useState<string | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isRefreshing, setRefreshing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isCategoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const categoryAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user?.familyId) {
      setItems([]);
      setLoading(false);
      setListError(null);
      return;
    }

    setLoading(true);
    setListError(null);

    const unsubscribe = subscribeToGroceryList(
      user.familyId,
      (newItems) => {
        setItems(newItems);
        setListError(null);
        setLoading(false);
      },
      (error) => {
        setListError(getFirebaseErrorMessage(error));
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.familyId, refreshSeed]);

  useEffect(() => {
    if (!user?.familyId) {
      setFamilyName("Our Family");
      return;
    }

    let isMounted = true;

    void getFamilyDetails(user.familyId)
      .then((family) => {
        if (!isMounted) return;
        const name = (family as Family | undefined)?.name?.trim();
        setFamilyName(name || "Our Family");
      })
      .catch(() => {
        if (!isMounted) return;
        setFamilyName("Our Family");
      });

    return () => {
      isMounted = false;
    };
  }, [user?.familyId]);

  useEffect(() => {
    if (!user?.familyId) {
      setMemberCount(0);
      return;
    }

    const unsubscribe = subscribeToFamilyMembers(
      user.familyId,
      (members) => {
        setMemberCount(members.length);
      },
      (error) => {
        const message = error.message || "";
        if (__DEV__) {
          console.warn("[HomeScreen] member subscription error:", message);
        }
        setMemberCount(0);
      },
    );

    return () => unsubscribe();
  }, [user?.familyId]);

  const sortedItems = useMemo(
    () => sortLegacyGroceryItemsForHome(items),
    [items],
  );

  const editingItem = useMemo(
    () =>
      editingItemId
        ? (items.find((item) => item.id === editingItemId) ?? null)
        : null,
    [items, editingItemId],
  );

  useEffect(() => {
    if (editingItemId && !editingItem) {
      setEditingItemId(null);
    }
  }, [editingItemId, editingItem]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sortedItems.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (activeCategory !== ALL_CATEGORY && item.category !== activeCategory) {
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
      ]
        .join(" ")
        .toLowerCase();

      return searchText.includes(query);
    });
  }, [sortedItems, statusFilter, activeCategory, searchQuery]);

  const sections = useMemo<GrocerySection[]>(() => {
    const pending = filteredItems.filter((item) => item.status === "pending");
    const completed = filteredItems.filter(
      (item) => item.status === "completed",
    );
    const output: GrocerySection[] = [];

    if (statusFilter !== "completed" && pending.length > 0) {
      output.push({
        key: "pending",
        title: "Pending Items",
        data: pending,
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

  const handleToggle = async (item: GroceryItem) => {
    if (!user) return;
    await toggleItemCompletion(item.id, item.status, {
      uid: user.uid,
      name: user.displayName,
    });
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const completedCount = items.filter((i) => i.status === "completed").length;
  const filteredCompletedCount = filteredItems.filter(
    (item) => item.status === "completed",
  ).length;
  const visibleCount = filteredItems.length;
  const categoryOptions = useMemo(() => {
    const fromItems = Array.from(
      new Set(sortedItems.map((item) => item.category).filter(Boolean)),
    );

    const merged = [...GROCERY_CATEGORIES, ...fromItems].filter(
      (category, index, self) => self.indexOf(category) === index,
    );

    return [ALL_CATEGORY, ...merged];
  }, [sortedItems]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshSeed((prev) => prev + 1);
    setTimeout(() => {
      setRefreshing(false);
    }, 650);
  };

  useEffect(() => {
    Animated.timing(categoryAnimation, {
      toValue: isCategoryFilterOpen ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isCategoryFilterOpen, categoryAnimation]);

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
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-background"
    >
      <StatusBar barStyle="dark-content" />
      <View
        className="absolute -left-24 -top-20 h-56 w-56 rounded-full bg-primary-100"
        style={{ opacity: 0.45 }}
      />
      <View
        className="absolute -right-24 top-44 h-52 w-52 rounded-full bg-secondary-100"
        style={{ opacity: 0.55 }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#59AC77" size="large" />
        </View>
      ) : listError ? (
        <View className="flex-1 items-center justify-center px-8">
          <EmptyState title="Unable to load list" description={listError} />
          <TouchableOpacity
            onPress={() => setRefreshSeed((prev) => prev + 1)}
            activeOpacity={0.85}
            className="mt-4 flex-row items-center rounded-full bg-primary-600 px-5 py-3"
          >
            <RefreshCw color="#f6fbf7" size={16} strokeWidth={2.4} />
            <Text className="ml-2 text-sm font-semibold text-text-inverse">
              Retry
            </Text>
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
              tintColor="#59AC77"
              colors={["#59AC77"]}
              progressBackgroundColor="#f8faf8"
            />
          }
          contentContainerStyle={{ paddingBottom: 140 }}
          ListHeaderComponent={
            <View className="px-6 pt-4">
              <View
                className="relative mb-6 flex-row items-start justify-between overflow-hidden rounded-3xl border border-border-muted/80 px-5 py-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.72)",
                  shadowColor: "#4f5f56",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.08,
                  shadowRadius: 14,
                  elevation: 3,
                }}
              >
                <View
                  pointerEvents="none"
                  className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/45"
                />
                <View
                  pointerEvents="none"
                  className="absolute -left-10 bottom-0 h-20 w-48 rounded-full bg-white/25"
                />
                <View
                  pointerEvents="none"
                  className="absolute left-0 right-0 top-0 h-10 bg-white/30"
                />
                <View className="flex-1 pr-4">
                  <Text className="text-[11px] font-semibold uppercase tracking-[2px] text-primary-700">
                    Shared Grocery
                  </Text>
                  <Text className="mt-1 text-[35px] font-black tracking-tight text-text-primary">
                    {familyName}
                  </Text>
                  <Text className="mt-1 text-[16px] font-medium leading-6 text-text-primary/75">
                    {pendingCount} pending · {completedCount} completed ·{" "}
                    {items.length} total
                  </Text>
                </View>
                <View className="items-center">
                  <View className="h-11 w-11 items-center justify-center rounded-full border border-border-muted bg-surface">
                    <Users stroke="#59AC77" size={19} />
                    {memberCount > 0 ? (
                      <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1">
                        <Text className="text-[10px] font-bold text-text-inverse">
                          {memberCount > 9 ? "9+" : memberCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="mt-1 text-[12px] font-medium text-text-secondary">
                    {memberCount} member
                    {memberCount === 1 ? "" : "s"}
                  </Text>
                </View>
              </View>

              <View
                className="mb-4 flex-row items-center rounded-2xl border border-border-muted/80 px-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.62)",
                  shadowColor: "#4f5f56",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.05,
                  shadowRadius: 12,
                  elevation: 2,
                }}
              >
                <Search stroke="#748379" size={18} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={SEARCH_PLACEHOLDER}
                  placeholderTextColor="#95a39a"
                  className="ml-3 h-12 flex-1 text-[17px] font-medium text-text-primary"
                />
              </View>

              <View className="mb-1 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  {STATUS_FILTERS.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      activeOpacity={0.8}
                      onPress={() => setStatusFilter(option.key)}
                      className={`mr-2 rounded-full border px-4 py-2.5 ${
                        statusFilter === option.key
                          ? "border-primary-300 bg-primary-50"
                          : "border-border-muted/80"
                      }`}
                      style={
                        statusFilter === option.key
                          ? undefined
                          : {
                              backgroundColor: "rgba(255,255,255,0.56)",
                            }
                      }
                    >
                      <Text
                        className={`text-[15px] font-semibold ${
                          statusFilter === option.key
                            ? "text-primary-700"
                            : "text-text-muted"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setCategoryFilterOpen((prev) => !prev)}
                  className={`rounded-full border p-2.5 ${
                    isCategoryFilterOpen || activeCategory !== ALL_CATEGORY
                      ? "border-primary-300 bg-primary-50"
                      : "border-border-muted/80"
                  }`}
                  style={
                    isCategoryFilterOpen || activeCategory !== ALL_CATEGORY
                      ? undefined
                      : {
                          backgroundColor: "rgba(255,255,255,0.56)",
                        }
                  }
                >
                  <SlidersHorizontal
                    stroke={
                      isCategoryFilterOpen || activeCategory !== ALL_CATEGORY
                        ? "#4a9a68"
                        : "#748379"
                    }
                    size={18}
                  />
                </TouchableOpacity>
              </View>

              <Animated.View
                className="overflow-hidden"
                style={categoryPanelStyle}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2 mt-2"
                  contentContainerStyle={{ paddingRight: 12 }}
                >
                  {categoryOptions.map((category) => (
                    <TouchableOpacity
                      key={category}
                      activeOpacity={0.8}
                      onPress={() => setActiveCategory(category)}
                      className={`mr-2 rounded-full border px-4 py-2.5 ${
                        activeCategory === category
                          ? "border-primary-300 bg-primary-50"
                          : "border-border-muted/80"
                      }`}
                      style={
                        activeCategory === category
                          ? undefined
                          : {
                              backgroundColor: "rgba(255,255,255,0.56)",
                            }
                      }
                    >
                      <Text
                        className={`text-[15px] font-semibold ${
                          activeCategory === category
                            ? "text-primary-700"
                            : "text-text-muted"
                        }`}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>

              <Text className="my-2 text-[12px] font-semibold uppercase tracking-[1.3px] text-text-muted">
                Showing {visibleCount} item
                {visibleCount === 1 ? "" : "s"}
              </Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View className="px-6 pb-1 pt-2">
              <Text className="text-[17px] font-semibold tracking-tight text-text-primary/90">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="px-6">
              <ItemCard
                item={item}
                onToggle={handleToggle}
                onPress={(currentItem) => setEditingItemId(currentItem.id)}
                currentUserId={user?.uid}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center px-6 pb-8 pt-14">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                <ShoppingBasket stroke="#59AC77" size={28} strokeWidth={2.2} />
              </View>
              <Text className="text-center text-[32px] font-bold tracking-tight text-text-primary">
                No items found
              </Text>
              <Text className="mt-2 text-center text-[16px] leading-6 text-text-muted">
                {searchQuery || activeCategory !== ALL_CATEGORY
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
                  className="flex-row items-center justify-center py-3"
                >
                  <Text className="mr-2 text-[14px] font-semibold text-text-secondary">
                    {showCompleted
                      ? "Hide completed items"
                      : `Show completed (${filteredCompletedCount})`}
                  </Text>
                  {showCompleted ? (
                    <ChevronUp stroke="#637889" size={16} strokeWidth={2.5} />
                  ) : (
                    <ChevronDown stroke="#637889" size={16} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
        className="absolute right-6 h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-xl shadow-primary-200"
        style={{
          bottom: insets.bottom + 78,
          elevation: 8,
          shadowColor: "#59AC77",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.28,
          shadowRadius: 15,
        }}
      >
        <Plus color="white" size={28} strokeWidth={2.4} />
      </TouchableOpacity>

      <AddItemModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        familyId={user?.familyId || ""}
        user={{
          uid: user?.uid || "",
          name: user?.displayName || "Anonymous",
        }}
      />

      <EditItemModal
        visible={Boolean(editingItemId)}
        onClose={() => setEditingItemId(null)}
        item={editingItem}
        familyId={user?.familyId || ""}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
