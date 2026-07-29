import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";

import {
  X,
  Edit2,
  Calendar,
  User,
  ShoppingBasket,
  AlignLeft,
  Info,
  Repeat,
  Wallet,
  Bell,
} from "lucide-react-native";
import { AuthenticatedStackNavigatorScreenProps, ROUTES } from "../types";

import { GroceryPriority } from "../features/grocery";
import { useDateFormatter, useGroceryItemBackend, useCreatePriceAlert } from "../hooks";
import { Card, Chip, PriorityBadge, SuperstoreComparisonCard } from "../components/ui";
import { useAuthStore } from "../store/useAuthStore";

import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Item Detail Screen
 * Why: To provide a robust view of item details via Python backend API.
 */
const ItemDetailScreen = ({
  route,
  navigation,
}: AuthenticatedStackNavigatorScreenProps<typeof ROUTES.ITEM_DETAIL>) => {
  const insets = useSafeAreaInsets();
  const { toDateLabel } = useDateFormatter();
  const { itemId } = route.params;
  const { user } = useAuthStore();

  // TanStack Query Hook for Python Backend API
  const { data: item, isLoading: loading } = useGroceryItemBackend(user?.familyId, itemId);
  const createPriceAlertMutation = useCreatePriceAlert();
  const [alertSet, setAlertSet] = useState(false);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#10B981" size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
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
    <View className="flex-1 bg-white" style={{ paddingTop: Math.max(insets.top, 20) }}>
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
              onPress={() => navigation.navigate(ROUTES.EDIT_ITEM, { itemId: item.id })}
              activeOpacity={0.7}
              className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-600 shadow-xs"
            >
              <Edit2 stroke="white" size={18} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              className="h-11 w-11 items-center justify-center rounded-2xl bg-white border border-border shadow-xs"
            >
              <X stroke="#475569" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Card padding={false} className="mb-6 overflow-hidden">
            <View className="flex-row items-center border-b border-border-muted p-5">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-2xl bg-primary-100">
                <ShoppingBasket stroke="#10B981" size={20} strokeWidth={2.5} />
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
              <View className="w-28">
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  Assignee
                </Text>
                <Text className="text-[14px] font-bold text-text-primary mt-0.5">
                  {item.assignee?.name || "—"}
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
              <View className="w-28">
                <Text className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
                  Due
                </Text>
                <Text className="text-[14px] font-bold text-text-primary mt-0.5">
                  {item.dueDate ? toDateLabel(item.dueDate) : "—"}
                </Text>
              </View>
            </View>
          </Card>

          {/* Superstore Price & Availability Comparison (Shwapno, Meena Bazar, Agora) */}
          <SuperstoreComparisonCard itemName={item.name} />

          {/* Set Price Drop Alert Action */}
          <TouchableOpacity
            onPress={() => {
              if (!user?.familyId) return;
              createPriceAlertMutation.mutate({
                familyId: user.familyId,
                query: item.name,
                targetPriceBDT: item.estimatedTotal || 500,
                unit: item.quantity || "1kg",
              });
              setAlertSet(true);
            }}
            disabled={alertSet || createPriceAlertMutation.isPending}
            activeOpacity={0.8}
            className={`mb-6 flex-row items-center justify-between p-4 rounded-2xl border ${
              alertSet ? "bg-emerald-50 border-emerald-300" : "bg-amber-50 border-amber-300"
            }`}
          >
            <View className="flex-row items-center flex-1 mr-3">
              <Bell
                size={20}
                color={alertSet ? "#10B981" : "#D97706"}
                style={{ marginRight: 10 }}
              />
              <View className="flex-1">
                <Text className="font-bold text-slate-900 text-sm">
                  {alertSet ? "Price Drop Monitor Active" : `Set Price Alert for ${item.name}`}
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  {alertSet
                    ? "We'll notify you when Shwapno, Meena or Agora price drops below target!"
                    : "Track market prices and get notified on price drops"}
                </Text>
              </View>
            </View>
            <View
              className={`px-3 py-1.5 rounded-xl ${alertSet ? "bg-emerald-600" : "bg-amber-500"}`}
            >
              <Text className="text-white font-bold text-xs">
                {alertSet
                  ? "Active"
                  : createPriceAlertMutation.isPending
                    ? "Setting..."
                    : "+ Alert"}
              </Text>
            </View>
          </TouchableOpacity>

          <Card className="mb-6 p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Repeat stroke="#4A90D9" size={16} strokeWidth={2.5} />
                <Text className="ml-2 text-[12px] font-bold uppercase tracking-wider text-text-muted">
                  Recurring
                </Text>
              </View>
              <Text className="text-[14px] font-bold text-text-primary">
                {item.recurrenceFrequency && item.recurrenceFrequency !== "none"
                  ? item.recurrenceFrequency
                  : "One-time"}
              </Text>
            </View>
            <View className="mt-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Wallet stroke="#10B981" size={16} strokeWidth={2.5} />
                <Text className="ml-2 text-[12px] font-bold uppercase tracking-wider text-text-muted">
                  Budget
                </Text>
              </View>
              <Text className="text-[14px] font-bold text-text-primary">
                {typeof item.estimatedTotal === "number"
                  ? `$${item.estimatedTotal.toFixed(2)}`
                  : typeof item.unitPrice === "number"
                    ? `$${item.unitPrice.toFixed(2)}`
                    : "—"}
              </Text>
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
              <Info stroke="#10B981" size={18} strokeWidth={2.5} className="mr-3" />
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

export default ItemDetailScreen;
