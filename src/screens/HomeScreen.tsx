import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, LayoutGrid, ListFilter, Search } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import {
  subscribeToGroceryList,
  toggleItemCompletion,
} from "../services/grocery";
import { GroceryItem } from "../types";
import ItemCard from "../components/ItemCard";
import AddItemModal from "../components/AddItemModal";
import EmptyState from "../components/EmptyState";

const HomeScreen = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<"Active" | "Completed">("Active");

  useEffect(() => {
    if (!user?.familyId) return;

    const unsubscribe = subscribeToGroceryList(user.familyId, (newItems) => {
      setItems(newItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.familyId]);

  const sortedItems = useMemo(() => {
    const filtered = items.filter((item) =>
      filter === "Active"
        ? item.status === "pending"
        : item.status === "completed",
    );

    if (filter === "Active") {
      // Sort priority: Urgent (1), Medium (2), Low (3)
      const priorityMap: Record<string, number> = {
        Urgent: 0,
        Medium: 1,
        Low: 2,
      };
      return [...filtered].sort((a, b) => {
        if (priorityMap[a.priority] !== priorityMap[b.priority]) {
          return priorityMap[a.priority] - priorityMap[b.priority];
        }
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
    }

    // For completed, just show latest first
    return [...filtered].sort(
      (a, b) => (b.completedAt?.seconds || 0) - (a.completedAt?.seconds || 0),
    );
  }, [items, filter]);

  const handleToggle = async (item: GroceryItem) => {
    if (!user) return;
    await toggleItemCompletion(item.id, item.status, {
      uid: user.uid,
      name: user.displayName,
    });
  };

  const activeCount = items.filter((i) => i.status === "pending").length;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-6 pt-4 pb-6 bg-surface/85 border-b border-border-muted flex-row justify-between items-end">
        <View>
          <Text className="text-primary-600 font-bold uppercase tracking-[2px] text-[10px] mb-1">
            Shared Grocery
          </Text>
          <Text className="text-3xl font-extrabold text-text-primary tracking-tight">
            Our List
          </Text>
        </View>
        <TouchableOpacity className="w-10 h-10 bg-surface-muted rounded-full items-center justify-center border border-border-muted">
          <Search stroke="#748379" size={20} />
        </TouchableOpacity>
      </View>

      {/* Filter Toggles */}
      <View className="px-6 py-4 flex-row justify-between items-center">
        <View className="flex-row bg-surface-subtle/90 p-1 rounded-2xl border border-border-muted">
          {(["Active", "Completed"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setFilter(t)}
              className={`px-5 py-2.5 rounded-xl ${filter === t ? "bg-surface shadow-sm shadow-secondary-100" : ""}`}
            >
              <Text
                className={`text-xs font-bold tracking-wide ${filter === t ? "text-primary-600" : "text-text-muted"}`}
              >
                {t}{" "}
                {t === "Active" && activeCount > 0 ? `(${activeCount})` : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity className="p-2 bg-primary-50 rounded-lg">
          <ListFilter stroke="#59AC77" size={18} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <View className="flex-1 px-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color="#59AC77" size="large" />
          </View>
        ) : sortedItems.length === 0 ? (
          <EmptyState
            title={
              filter === "Active" ? "The list is empty" : "No completed items"
            }
            description={
              filter === "Active"
                ? "Tap the '+' button below to add your first grocery item."
                : "Items you complete will show up here for future reference."
            }
          />
        ) : (
          <FlatList
            data={sortedItems}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                onToggle={handleToggle}
                onPress={() => {}}
              />
            )}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        className="absolute bottom-32 right-6 w-16 h-16 bg-primary-600 rounded-2xl items-center justify-center shadow-xl shadow-primary-200"
        style={{
          elevation: 8,
          shadowColor: "#59AC77",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.28,
          shadowRadius: 15,
        }}
      >
        <Plus color="white" size={32} strokeWidth={2.5} />
      </TouchableOpacity>

      <AddItemModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        familyId={user?.familyId || ""}
        user={{ uid: user?.uid || "", name: user?.displayName || "Anonymous" }}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
