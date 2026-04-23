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
import { subscribeToGroceryList, toggleItemCompletion } from "../services/grocery";
import { Family, GroceryItem } from "../types";
import ItemCard from "../components/ItemCard";
import AddItemModal from "../components/AddItemModal";
import EditItemModal from "../components/EditItemModal";
import EmptyState from "../components/EmptyState";
import { GROCERY_CATEGORIES, sortLegacyGroceryItemsForHome } from "../features/grocery";
import { getFamilyDetails, subscribeToFamilyMembers } from "../services/family";
import { AppHeader } from "../components/ui";
import ItemDetailModal from "../components/ItemDetailModal";
import NotificationModal from "../components/NotificationModal";

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

  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isNotifOpen, setNotifOpen] = useState(false);

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

  const sortedItems = useMemo(() => sortLegacyGroceryItemsForHome(items), [items]);

  const viewingItem = useMemo(
    () => (viewingItemId ? (items.find((item) => item.id === viewingItemId) ?? null) : null),
    [items, viewingItemId],
  );

  const editingItem = useMemo(
    () => (editingItemId ? (items.find((item) => item.id === editingItemId) ?? null) : null),
    [items, editingItemId],
  );

  useEffect(() => {
    if (editingItemId && !editingItem) {
      setEditingItemId(null);
    }
  }, [editingItemId, editingItem]);

  useEffect(() => {
    if (viewingItemId && !viewingItem) {
      setViewingItemId(null);
    }
  }, [viewingItemId, viewingItem]);

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
    const completed = filteredItems.filter((item) => item.status === "completed");
    const output: GrocerySection[] = [];

    if (statusFilter !== "completed" && pending.length > 0) {
      const grouped = pending.reduce<Record<string, GroceryItem[]>>((acc, item) => {
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

  const handleToggle = async (item: GroceryItem) => {
    if (!user) return;
    await toggleItemCompletion(item, {
      uid: user.uid,
      name: user.displayName,
    });
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
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      <AppHeader
        title="Grocery List"
        eyebrow="My Family"
        onNotificationPress={() => setNotifOpen(true)}
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
            <Text className="ml-2 text-sm font-semibold text-text-inverse">Retry</Text>
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
                className="mb-4 flex-row items-center rounded-2xl border border-border-muted bg-surface px-4"
                style={{
                  shadowColor: "#1f2a25",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.02,
                  shadowRadius: 8,
                  elevation: 1,
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
                          : "border-border-muted bg-surface"
                      }`}
                    >
                      <Text
                        className={`text-[15px] font-semibold ${
                          statusFilter === option.key ? "text-primary-700" : "text-text-muted"
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
                      : "border-border-muted bg-surface"
                  }`}
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

              <Animated.View className="overflow-hidden" style={categoryPanelStyle}>
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
                          : "border-border-muted bg-surface"
                      }`}
                    >
                      <Text
                        className={`text-[15px] font-semibold ${
                          activeCategory === category ? "text-primary-700" : "text-text-muted"
                        }`}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>

              <Text className="my-4 pt-1 text-[12px] font-semibold uppercase tracking-[1.3px] text-text-muted">
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
                onPress={(currentItem) => setViewingItemId(currentItem.id)}
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

      <ItemDetailModal
        visible={Boolean(viewingItemId)}
        onClose={() => setViewingItemId(null)}
        item={viewingItem}
        onEdit={(item) => {
          setViewingItemId(null);
          setEditingItemId(item.id);
        }}
      />

      <EditItemModal
        visible={Boolean(editingItemId)}
        onClose={() => setEditingItemId(null)}
        item={editingItem}
        familyId={user?.familyId || ""}
      />

      <NotificationModal visible={isNotifOpen} onClose={() => setNotifOpen(false)} />
    </SafeAreaView>
  );
};

export default HomeScreen;
