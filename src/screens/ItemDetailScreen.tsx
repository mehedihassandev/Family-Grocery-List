import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { X, Edit2, Calendar, User, ShoppingBasket, AlignLeft, Info } from "lucide-react-native";
import { AuthenticatedStackNavigatorScreenProps, ERootRoutes } from "../types";
import { GroceryPriority } from "../features/grocery";
import { useDateFormatter } from "../hooks";
import { Card, Chip, PriorityBadge } from "../components/ui";
import { useGroceryItem } from "../hooks/queries/useGroceryQueries";

import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Item Detail Screen
 * Why: To provide a robust view of item details that maintains correct navigation context.
 */
const ItemDetailScreen = ({
  route,
  navigation,
}: AuthenticatedStackNavigatorScreenProps<ERootRoutes.ITEM_DETAIL>) => {
  const insets = useSafeAreaInsets();
  const { toDateLabel } = useDateFormatter();
  const { itemId } = route.params;

  // TanStack Query Hook
  const { data: item, isLoading: loading } = useGroceryItem(itemId);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3DB87A" size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-muted">Item not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-primary-600 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const modelPriority: GroceryPriority =
    item.priority === "Urgent" ? "urgent" : item.priority === "Medium" ? "medium" : "low";

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: Math.max(insets.top, 20) }}>
      <View className="flex-1 px-6">
        <View className="mb-8 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-[10px] font-bold uppercase tracking-[2px] text-primary-600">
              Item Details
            </Text>
            <Text className="mt-1 text-[32px] font-black tracking-tight text-text-primary leading-tight">
              {item.name}
            </Text>
            <View className="mt-4 flex-row flex-wrap items-center gap-2">
              <Chip
                label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                selected={item.status === "completed"}
              />
              {item.status === "pending" ? <PriorityBadge priority={modelPriority} /> : null}
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => navigation.navigate(ERootRoutes.EDIT_ITEM, { itemId: item.id })}
              activeOpacity={0.7}
              className="h-11 w-11 items-center justify-center rounded-full bg-primary-600"
              style={styles.actionShadow}
            >
              <Edit2 stroke="white" size={18} strokeWidth={3} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-muted border border-border-muted"
            >
              <X stroke="#748379" size={20} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Card padding={false} className="mb-6 overflow-hidden">
            <View className="flex-row items-center border-b border-border-muted p-5">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-2xl bg-primary-100">
                <ShoppingBasket stroke="#3DB87A" size={20} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  Category
                </Text>
                <Text className="text-[16px] font-bold text-text-primary mt-0.5">
                  {item.category || "Uncategorized"}
                </Text>
              </View>
              <View className="w-24">
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  Quantity
                </Text>
                <Text className="text-[16px] font-bold text-text-primary mt-0.5">
                  {item.quantity ? item.quantity : "—"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center border-b border-border-muted p-5">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-2xl bg-secondary-100">
                <User stroke="#637889" size={20} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  Added By
                </Text>
                <Text className="text-[16px] font-bold text-text-primary mt-0.5">
                  {item.addedBy?.name || "Unknown"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center p-5">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                <Calendar stroke="#64748b" size={20} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  Created At
                </Text>
                <Text className="text-[16px] font-bold text-text-primary mt-0.5">
                  {toDateLabel(item.createdAt)}
                </Text>
              </View>
            </View>
          </Card>

          {item.notes ? (
            <View className="mb-6">
              <View className="mb-3 flex-row items-center px-1">
                <AlignLeft stroke="#748379" size={16} strokeWidth={2.5} />
                <Text className="ml-2 text-[11px] font-bold uppercase tracking-[2px] text-text-muted">
                  Notes
                </Text>
              </View>
              <Card className="bg-surface-muted border-dashed">
                <Text className="text-[15px] leading-relaxed text-text-primary">{item.notes}</Text>
              </Card>
            </View>
          ) : null}

          {item.status === "completed" && item.completedBy && (
            <View className="flex-row items-center rounded-2xl bg-primary-50 p-4 border border-primary-100">
              <Info stroke="#3DB87A" size={18} strokeWidth={2.5} className="mr-3" />
              <Text className="text-[14px] font-medium text-primary-800">
                Completed by <Text className="font-black">{item.completedBy.name}</Text>
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
});

export default ItemDetailScreen;
