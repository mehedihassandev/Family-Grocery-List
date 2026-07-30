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
import {
  useDateFormatter,
  useGroceryItemBackend,
  useCreatePriceAlert,
  useAppTheme,
} from "../hooks";
import { Card, Chip, PriorityBadge, SuperstoreComparisonCard } from "../components/ui";
import { useAuthStore } from "../store/useAuthStore";

import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Item Detail Screen
 * Why: To provide a robust view of item details with clean Light/Dark mode design system.
 */
const ItemDetailScreen = ({
  route,
  navigation,
}: AuthenticatedStackNavigatorScreenProps<typeof ROUTES.ITEM_DETAIL>) => {
  const insets = useSafeAreaInsets();
  const { toDateLabel } = useDateFormatter();
  const { colors } = useAppTheme();
  const { itemId } = route.params;
  const { user } = useAuthStore();

  // TanStack Query Hook for Python Backend API
  const { data: item, isLoading: loading } = useGroceryItemBackend(user?.familyId, itemId);
  const createPriceAlertMutation = useCreatePriceAlert();
  const [alertSet, setAlertSet] = useState(false);

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.bgCanvas }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!item) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.bgCanvas }}
      >
        <Text style={{ color: colors.textMuted }}>Item not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="font-bold" style={{ color: colors.accent }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const modelPriority: GroceryPriority =
    item.priority === "Urgent" ? "urgent" : item.priority === "Medium" ? "medium" : "low";

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: colors.bgCanvas, paddingTop: Math.max(insets.top, 20) }}
    >
      <View className="flex-1 px-6">
        <View className="mb-8 flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text
              className="text-[10px] font-bold uppercase tracking-[2px]"
              style={{ color: colors.accent }}
            >
              Item Details
            </Text>
            <Text
              className="mt-1 text-[32px] font-black tracking-tight leading-tight"
              style={{ color: colors.textPrimary }}
            >
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
              className="h-11 w-11 items-center justify-center rounded-xl shadow-xs"
              style={{ backgroundColor: colors.accent }}
            >
              <Edit2 stroke="white" size={18} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              className="h-11 w-11 items-center justify-center rounded-xl border shadow-xs"
              style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
            >
              <X stroke={colors.icon} size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Card
            padding={false}
            className="mb-6 rounded-xl overflow-hidden border"
            style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
          >
            <View
              className="flex-row items-center p-5 border-b"
              style={{ borderColor: colors.border }}
            >
              <View
                className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.accentMuted }}
              >
                <ShoppingBasket stroke={colors.accent} size={20} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: colors.textMuted }}
                >
                  Category
                </Text>
                <Text
                  className="text-[16px] font-bold mt-0.5"
                  style={{ color: colors.textPrimary }}
                >
                  {item.category || "Uncategorized"}
                </Text>
              </View>
              <View className="w-24">
                <Text
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: colors.textMuted }}
                >
                  Quantity
                </Text>
                <Text
                  className="text-[16px] font-bold mt-0.5"
                  style={{ color: colors.textPrimary }}
                >
                  {item.quantity ? item.quantity : "—"}
                </Text>
              </View>
            </View>

            <View
              className="flex-row items-center p-5 border-b"
              style={{ borderColor: colors.border }}
            >
              <View
                className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.infoLight }}
              >
                <User stroke={colors.info} size={20} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: colors.textMuted }}
                >
                  Added By
                </Text>
                <Text
                  className="text-[16px] font-bold mt-0.5"
                  style={{ color: colors.textPrimary }}
                >
                  {item.addedBy?.name || "Unknown"}
                </Text>
              </View>
              <View className="w-28">
                <Text
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: colors.textMuted }}
                >
                  Assignee
                </Text>
                <Text
                  className="text-[14px] font-bold mt-0.5"
                  style={{ color: colors.textPrimary }}
                >
                  {item.assignee?.name || "—"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center p-5">
              <View
                className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.bgInput }}
              >
                <Calendar stroke={colors.icon} size={20} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: colors.textMuted }}
                >
                  Created At
                </Text>
                <Text
                  className="text-[16px] font-bold mt-0.5"
                  style={{ color: colors.textPrimary }}
                >
                  {toDateLabel(item.createdAt)}
                </Text>
              </View>
              <View className="w-28">
                <Text
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: colors.textMuted }}
                >
                  Due
                </Text>
                <Text
                  className="text-[14px] font-bold mt-0.5"
                  style={{ color: colors.textPrimary }}
                >
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
            className="mb-6 flex-row items-center justify-between p-4 rounded-xl border"
            style={{
              backgroundColor: alertSet ? colors.accentLightSubtle : colors.badgeAmberBg,
              borderColor: alertSet ? colors.border : colors.badgeAmberBorder,
            }}
          >
            <View className="flex-row items-center flex-1 mr-3">
              <Bell
                size={20}
                color={alertSet ? colors.accent : colors.warning}
                style={{ marginRight: 10 }}
              />
              <View className="flex-1">
                <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                  {alertSet ? "Price Drop Monitor Active" : `Set Price Alert for ${item.name}`}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
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

          <Card
            className="mb-6 p-5 border"
            style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Repeat stroke="#4A90D9" size={16} strokeWidth={2.5} />
                <Text
                  className="ml-2 text-[12px] font-bold uppercase tracking-wider"
                  style={{ color: colors.textMuted }}
                >
                  Recurring
                </Text>
              </View>
              <Text className="text-[14px] font-bold" style={{ color: colors.textPrimary }}>
                {item.recurrenceFrequency && item.recurrenceFrequency !== "none"
                  ? item.recurrenceFrequency
                  : "One-time"}
              </Text>
            </View>
            <View className="mt-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Wallet stroke={colors.accent} size={16} strokeWidth={2.5} />
                <Text
                  className="ml-2 text-[12px] font-bold uppercase tracking-wider"
                  style={{ color: colors.textMuted }}
                >
                  Budget
                </Text>
              </View>
              <Text className="text-[14px] font-bold" style={{ color: colors.textPrimary }}>
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
                <Text
                  className="ml-2 text-[11px] font-bold uppercase tracking-[2px]"
                  style={{ color: colors.textMuted }}
                >
                  Notes
                </Text>
              </View>
              <Card
                className="border-dashed"
                style={{ backgroundColor: colors.bgInput, borderColor: colors.border }}
              >
                <Text className="text-[15px] leading-relaxed" style={{ color: colors.textPrimary }}>
                  {item.notes}
                </Text>
              </Card>
            </View>
          ) : null}

          {item.status === "completed" && item.completedBy && (
            <View
              className="flex-row items-center rounded-xl p-4 border"
              style={{ backgroundColor: colors.accentLightSubtle, borderColor: colors.border }}
            >
              <Info stroke={colors.accent} size={18} strokeWidth={2.5} className="mr-3" />
              <Text className="text-[14px] font-medium" style={{ color: colors.accent }}>
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
