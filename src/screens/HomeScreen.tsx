import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ListFilter,
  Plus,
  RefreshCw,
  Search,
  Users,
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
import { AppHeader, Chip } from "../components/ui";

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

    if (statusFilter !== "pending" && completed.length > 0) {
      output.push({
        key: "completed",
        title: "Completed Items",
        data: completed,
      });
    }

    return output;
  }, [filteredItems, statusFilter]);

  const handleToggle = async (item: GroceryItem) => {
    if (!user) return;
    await toggleItemCompletion(item.id, item.status, {
      uid: user.uid,
      name: user.displayName,
    });
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const completedCount = items.filter((i) => i.status === "completed").length;
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      <AppHeader
        eyebrow="Shared Grocery"
        title={familyName}
        right={
          <View className="h-10 w-10 items-center justify-center rounded-full border border-border-muted bg-surface-muted">
            <Users stroke="#59AC77" size={20} />
            {memberCount > 0 ? (
              <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-600 px-1">
                <Text className="text-[10px] font-bold text-text-inverse">
                  {memberCount > 9 ? "9+" : memberCount}
                </Text>
              </View>
            ) : null}
          </View>
        }
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
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          ListHeaderComponent={
            <View className="px-5 pt-4">
              <View className="rounded-3xl border border-border bg-surface p-5 shadow-sm shadow-secondary-100/40">
                <Text className="text-[10px] font-bold uppercase tracking-[2px] text-primary-600">
                  Family Summary
                </Text>
                <Text className="mt-1 text-2xl font-extrabold text-text-primary">
                  {pendingCount} pending
                </Text>
                <Text className="mt-1 text-sm text-text-secondary">
                  {completedCount} completed · {items.length} total
                </Text>
                <Text className="mt-2 text-xs text-text-muted">
                  {memberCount} member{memberCount === 1 ? "" : "s"} synced live
                </Text>
              </View>

              <View className="mt-4 flex-row items-center rounded-2xl border border-border bg-surface px-4 py-1">
                <Search stroke="#748379" size={18} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={SEARCH_PLACEHOLDER}
                  placeholderTextColor="#95a39a"
                  className="ml-3 h-11 flex-1 text-[15px] text-text-primary"
                />
              </View>

              <View className="mt-4 flex-row items-center">
                <View className="rounded-xl bg-primary-50 p-2 mr-3">
                  <ListFilter stroke="#59AC77" size={16} />
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                >
                  {STATUS_FILTERS.map((option) => (
                    <Chip
                      key={option.key}
                      label={option.label}
                      selected={statusFilter === option.key}
                      onPress={() => setStatusFilter(option.key)}
                    />
                  ))}
                </ScrollView>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-4"
                contentContainerStyle={{ gap: 8, paddingRight: 8 }}
              >
                {categoryOptions.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    selected={activeCategory === category}
                    onPress={() => setActiveCategory(category)}
                  />
                ))}
              </ScrollView>

              <Text className="mt-4 mb-2 px-1 text-xs font-semibold uppercase tracking-[1.5px] text-text-muted">
                Showing {visibleCount} item{visibleCount === 1 ? "" : "s"}
              </Text>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View className="px-5 pb-2 pt-3">
              <Text className="text-base font-bold text-text-primary">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="px-4">
              <ItemCard
                item={item}
                onToggle={handleToggle}
                onPress={(currentItem) => setEditingItemId(currentItem.id)}
                currentUserId={user?.uid}
              />
            </View>
          )}
          ListEmptyComponent={
            <View className="px-5 pt-10">
              <EmptyState
                title="No items found"
                description={
                  searchQuery || activeCategory !== ALL_CATEGORY
                    ? "Try a different search or category filter."
                    : "Tap '+' to add your first grocery item."
                }
              />
            </View>
          }
        />
      )}

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
        className="absolute bottom-32 right-6 h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 shadow-xl shadow-primary-200"
        style={{
          elevation: 8,
          shadowColor: "#59AC77",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.28,
          shadowRadius: 15,
        }}
      >
        <Plus color="white" size={32} strokeWidth={2.4} />
      </TouchableOpacity>

      <AddItemModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        familyId={user?.familyId || ""}
        user={{ uid: user?.uid || "", name: user?.displayName || "Anonymous" }}
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
