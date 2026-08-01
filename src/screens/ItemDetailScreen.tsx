import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Edit2,
  Calendar,
  ShoppingBasket,
  Info,
  Repeat,
  Wallet,
  Bell,
  CheckCircle2,
  Apple,
  Fish,
  Egg,
  IceCream,
  Snowflake,
  CupSoda,
  Home,
  Leaf,
  Check,
} from "lucide-react-native";
import { AuthenticatedStackNavigatorScreenProps, ROUTES } from "../types";
import { GroceryPriority } from "../features/grocery";
import {
  useDateFormatter,
  useGroceryItemBackend,
  useToggleItemCompletionBackend,
  useCreatePriceAlert,
  useAppTheme,
  useTextFormatter,
} from "../hooks";
import {
  PriorityBadge,
  SuperstoreComparisonCard,
  LoadingOverlay,
  StatusModal,
} from "../components/ui";
import { useAuthStore } from "../store/useAuthStore";

const CATEGORY_ITEMS_MAP: Record<
  string,
  { icon: React.ComponentType<any>; bgColor: string; iconColor: string }
> = {
  Produce: { icon: Apple, bgColor: "#D1FAE5", iconColor: "#006837" },
  "Meat/Seafood": { icon: Fish, bgColor: "#E0F2FE", iconColor: "#0284C7" },
  "Dairy/Eggs": { icon: Egg, bgColor: "#EBF2FF", iconColor: "#4F46E5" },
  Snacks: { icon: IceCream, bgColor: "#F3E8FF", iconColor: "#7E22CE" },
  Frozen: { icon: Snowflake, bgColor: "#E0F2FE", iconColor: "#0284C7" },
  Beverages: { icon: CupSoda, bgColor: "#EBF2FF", iconColor: "#4F46E5" },
  Household: { icon: Home, bgColor: "#E0F2FE", iconColor: "#0284C7" },
  Personal: { icon: Leaf, bgColor: "#EBF2FF", iconColor: "#4F46E5" },
};

/**
 * Item Detail Screen redesigned to match AddItemScreen and EditItemScreen design system
 */
const ItemDetailScreen = ({
  route,
  navigation,
}: AuthenticatedStackNavigatorScreenProps<typeof ROUTES.ITEM_DETAIL>) => {
  const { toDateLabel } = useDateFormatter();
  const { isDark } = useAppTheme();
  const { toInitial } = useTextFormatter();
  const { itemId } = route.params;
  const { user } = useAuthStore();
  const familyId = user?.familyId || "";

  // TanStack Query Hooks for Backend API
  const { data: item, isLoading: loading } = useGroceryItemBackend(familyId, itemId);
  const toggleMutation = useToggleItemCompletionBackend(familyId);
  const createPriceAlertMutation = useCreatePriceAlert();
  const [alertSet, setAlertSet] = useState(false);

  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  if (loading) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
      />
    );
  }

  if (!item) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
      >
        <Text style={{ color: isDark ? "#94A3B8" : "#64748B" }}>Item not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="font-bold" style={{ color: isDark ? "#34D399" : "#006837" }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const modelPriority: GroceryPriority =
    item.priority === "Urgent" || item.priority === "High"
      ? "urgent"
      : item.priority === "Medium"
        ? "medium"
        : "low";

  const catMeta = CATEGORY_ITEMS_MAP[item.category || ""] || {
    icon: ShoppingBasket,
    bgColor: "#EEF4FF",
    iconColor: "#4F46E5",
  };
  const CategoryIcon = catMeta.icon;

  const handleToggleStatus = () => {
    toggleMutation.mutate(
      { itemId: item.id, currentStatus: item.status },
      {
        onError: (error) => {
          setStatusModal({
            visible: true,
            title: "Update Failed",
            message: error instanceof Error ? error.message : "Could not update item status.",
            type: "error",
          });
        },
      },
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
    >
      <LoadingOverlay visible={toggleMutation.isPending} />
      <StatusModal
        visible={statusModal.visible}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
      />

      {/* Top Header Row */}
      <View className="px-5 py-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          className="h-10 w-10 rounded-full items-center justify-center border shadow-xs"
          style={{
            backgroundColor: isDark ? "#17233D" : "#EEF4FF",
            borderColor: isDark ? "#253347" : "#E2E8F0",
          }}
        >
          <ChevronLeft stroke={isDark ? "#FFFFFF" : "#0F172A"} size={20} strokeWidth={2.5} />
        </TouchableOpacity>

        <Text
          className="text-xl font-black tracking-tight"
          style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
        >
          Item Details
        </Text>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.EDIT_ITEM, { itemId: item.id })}
            activeOpacity={0.75}
            className="h-10 w-10 rounded-full items-center justify-center border shadow-xs"
            style={{
              backgroundColor: isDark ? "#10B981" : "#006837",
              borderColor: "transparent",
            }}
          >
            <Edit2 stroke="#FFFFFF" size={18} strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => (navigation as any).navigate(ROUTES.PROFILE)}
            activeOpacity={0.8}
            className="h-10 w-10 rounded-full items-center justify-center overflow-hidden border shadow-xs"
            style={{ backgroundColor: isDark ? "#10B981" : "#006837", borderColor: "transparent" }}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-white font-black text-sm">
                {toInitial(user?.displayName || "M")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
      >
        {/* HERO CARD */}
        <View
          className="rounded-2xl p-5 mb-6 border shadow-sm"
          style={{
            backgroundColor: isDark ? "#17233D" : "#FFFFFF",
            borderColor: isDark ? "#253347" : "#E2E8F0",
          }}
        >
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-row items-center flex-1 mr-3">
              <View
                className="h-14 w-14 rounded-2xl items-center justify-center mr-3.5 shadow-xs"
                style={{ backgroundColor: catMeta.bgColor }}
              >
                <CategoryIcon stroke={catMeta.iconColor} size={26} strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[11px] font-extrabold uppercase tracking-wider mb-0.5"
                  style={{ color: isDark ? "#34D399" : "#006837" }}
                >
                  {item.category || "Uncategorized"}
                </Text>
                <Text
                  className="text-2xl font-black tracking-tight"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
              </View>
            </View>
          </View>

          {/* Status & Priority Badges Row */}
          <View className="flex-row flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Status Pill */}
            <View
              className="px-3 py-1.5 rounded-full flex-row items-center"
              style={{
                backgroundColor:
                  item.status === "completed"
                    ? isDark
                      ? "#064E3B"
                      : "#D1FAE5"
                    : item.status === "in_cart"
                      ? isDark
                        ? "#1E3A8A"
                        : "#DBEAFE"
                      : isDark
                        ? "#451A03"
                        : "#FEF3C7",
              }}
            >
              <CheckCircle2
                size={14}
                stroke={
                  item.status === "completed"
                    ? isDark
                      ? "#34D399"
                      : "#006837"
                    : item.status === "in_cart"
                      ? isDark
                        ? "#60A5FA"
                        : "#1D4ED8"
                      : isDark
                        ? "#FBBF24"
                        : "#D97706"
                }
                strokeWidth={2.2}
                className="mr-1.5"
              />
              <Text
                className="text-[12px] font-extrabold capitalize"
                style={{
                  color:
                    item.status === "completed"
                      ? isDark
                        ? "#34D399"
                        : "#006837"
                      : item.status === "in_cart"
                        ? isDark
                          ? "#60A5FA"
                          : "#1D4ED8"
                        : isDark
                          ? "#FBBF24"
                          : "#B45309",
                }}
              >
                {item.status === "in_cart"
                  ? "In Cart"
                  : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>

            {/* Priority Badge */}
            {item.status === "pending" ? <PriorityBadge priority={modelPriority} /> : null}

            {/* Quantity Badge */}
            {item.quantity ? (
              <View
                className="px-3 py-1.5 rounded-full border flex-row items-center ml-auto"
                style={{
                  backgroundColor: isDark ? "#16233B" : "#EEF4FF",
                  borderColor: isDark ? "#253347" : "#D9E2FC",
                }}
              >
                <Text
                  className="text-[12px] font-black"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                >
                  {item.quantity} {item.unit ? item.unit : ""}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* SECTION: DETAILS GRID CARDS */}
        <View className="mb-6 gap-3">
          {/* Row 1: Assignee & Creator */}
          <View className="flex-row gap-3">
            <View
              className="flex-1 p-4 rounded-2xl border shadow-xs"
              style={{
                backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#D9E2FC",
              }}
            >
              <Text
                className="text-[10px] font-extrabold uppercase tracking-wider mb-2"
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              >
                ASSIGNED TO
              </Text>
              <View className="flex-row items-center">
                <View
                  className="h-9 w-9 rounded-full items-center justify-center overflow-hidden mr-2.5 border"
                  style={{
                    backgroundColor: isDark ? "#10B981" : "#006837",
                    borderColor: "transparent",
                  }}
                >
                  {item.assignee?.photoURL ? (
                    <Image source={{ uri: item.assignee.photoURL }} className="h-full w-full" />
                  ) : (
                    <Text className="text-white text-xs font-black">
                      {toInitial(item.assignee?.name || "A")}
                    </Text>
                  )}
                </View>
                <Text
                  className="text-[14px] font-bold flex-1"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                  numberOfLines={1}
                >
                  {item.assignee?.name || "Unassigned"}
                </Text>
              </View>
            </View>

            <View
              className="flex-1 p-4 rounded-2xl border shadow-xs"
              style={{
                backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#D9E2FC",
              }}
            >
              <Text
                className="text-[10px] font-extrabold uppercase tracking-wider mb-2"
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              >
                ADDED BY
              </Text>
              <View className="flex-row items-center">
                <View
                  className="h-9 w-9 rounded-full items-center justify-center overflow-hidden mr-2.5 border"
                  style={{
                    backgroundColor: isDark ? "#4F46E5" : "#6366F1",
                    borderColor: "transparent",
                  }}
                >
                  {item.addedBy?.photoURL ? (
                    <Image source={{ uri: item.addedBy.photoURL }} className="h-full w-full" />
                  ) : (
                    <Text className="text-white text-xs font-black">
                      {toInitial(item.addedBy?.name || "U")}
                    </Text>
                  )}
                </View>
                <Text
                  className="text-[14px] font-bold flex-1"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                  numberOfLines={1}
                >
                  {item.addedBy?.name || "Family Member"}
                </Text>
              </View>
            </View>
          </View>

          {/* Row 2: Dates */}
          <View className="flex-row gap-3">
            <View
              className="flex-1 p-4 rounded-2xl border shadow-xs flex-row items-center"
              style={{
                backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#D9E2FC",
              }}
            >
              <View
                className="h-10 w-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: isDark ? "#16233B" : "#E0E7FF" }}
              >
                <Calendar stroke={isDark ? "#818CF8" : "#4F46E5"} size={18} strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[10px] font-extrabold uppercase tracking-wider"
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                >
                  DUE DATE
                </Text>
                <Text
                  className="text-[13px] font-bold mt-0.5"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                >
                  {item.dueDate ? toDateLabel(item.dueDate) : "No due date"}
                </Text>
              </View>
            </View>

            <View
              className="flex-1 p-4 rounded-2xl border shadow-xs flex-row items-center"
              style={{
                backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#D9E2FC",
              }}
            >
              <View
                className="h-10 w-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: isDark ? "#16233B" : "#E0F2FE" }}
              >
                <Repeat stroke={isDark ? "#38BDF8" : "#0284C7"} size={18} strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[10px] font-extrabold uppercase tracking-wider"
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                >
                  RECURRING
                </Text>
                <Text
                  className="text-[13px] font-bold mt-0.5 capitalize"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                >
                  {item.recurrenceFrequency && item.recurrenceFrequency !== "none"
                    ? item.recurrenceFrequency
                    : "One-time"}
                </Text>
              </View>
            </View>
          </View>

          {/* Row 3: Financials / Budget */}
          {(typeof item.estimatedTotal === "number" || typeof item.unitPrice === "number") && (
            <View
              className="p-4 rounded-2xl border shadow-xs flex-row items-center justify-between"
              style={{
                backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#D9E2FC",
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="h-10 w-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: isDark ? "#064E3B" : "#D1FAE5" }}
                >
                  <Wallet stroke={isDark ? "#34D399" : "#006837"} size={18} strokeWidth={2.2} />
                </View>
                <View>
                  <Text
                    className="text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                  >
                    ESTIMATED BUDGET
                  </Text>
                  <Text
                    className="text-[15px] font-black mt-0.5"
                    style={{ color: isDark ? "#34D399" : "#006837" }}
                  >
                    {typeof item.estimatedTotal === "number"
                      ? `$${item.estimatedTotal.toFixed(2)}`
                      : typeof item.unitPrice === "number"
                        ? `$${item.unitPrice.toFixed(2)}`
                        : "—"}
                  </Text>
                </View>
              </View>

              {typeof item.unitPrice === "number" && (
                <Text
                  className="text-[12px] font-bold"
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                >
                  Unit: ${item.unitPrice.toFixed(2)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Superstore Comparison Card */}
        <SuperstoreComparisonCard itemName={item.name} />

        {/* Price Drop Alert Card */}
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
          className="mb-6 flex-row items-center justify-between p-4 rounded-2xl border shadow-xs"
          style={{
            backgroundColor: alertSet
              ? isDark
                ? "#064E3B"
                : "#D1FAE5"
              : isDark
                ? "#451A03"
                : "#FEF3C7",
            borderColor: alertSet
              ? isDark
                ? "#047857"
                : "#A7F3D0"
              : isDark
                ? "#78350F"
                : "#FDE68A",
          }}
        >
          <View className="flex-row items-center flex-1 mr-3">
            <Bell
              size={20}
              color={alertSet ? (isDark ? "#34D399" : "#006837") : isDark ? "#FBBF24" : "#B45309"}
              style={{ marginRight: 12 }}
            />
            <View className="flex-1">
              <Text
                className="font-black text-[14px]"
                style={{
                  color: alertSet
                    ? isDark
                      ? "#34D399"
                      : "#006837"
                    : isDark
                      ? "#FBBF24"
                      : "#B45309",
                }}
              >
                {alertSet ? "Price Drop Monitor Active" : `Set Price Alert for ${item.name}`}
              </Text>
              <Text
                className="text-[12px] font-bold mt-0.5"
                style={{ color: isDark ? "#CBD5E1" : "#475569" }}
              >
                {alertSet
                  ? "We'll notify you when superstore prices drop!"
                  : "Track market prices and get notified on price drops"}
              </Text>
            </View>
          </View>
          <View
            className={`px-3 py-1.5 rounded-full ${alertSet ? "bg-emerald-600" : "bg-amber-500"}`}
          >
            <Text className="text-white font-bold text-xs">
              {alertSet ? "Active" : createPriceAlertMutation.isPending ? "Setting..." : "+ Alert"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* NOTES SECTION */}
        {item.notes ? (
          <View className="mb-6">
            <Text
              className="text-[11px] font-extrabold uppercase tracking-wider mb-2"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              NOTES
            </Text>
            <View
              className="rounded-2xl p-4 border shadow-xs"
              style={{
                backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#D9E2FC",
              }}
            >
              <Text
                className="text-[14px] font-bold leading-relaxed"
                style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
              >
                {item.notes}
              </Text>
            </View>
          </View>
        ) : null}

        {/* COMPLETED BY BANNER */}
        {item.status === "completed" && item.completedBy && (
          <View
            className="flex-row items-center rounded-2xl p-4 mb-6 border"
            style={{
              backgroundColor: isDark ? "#064E3B" : "#D1FAE5",
              borderColor: isDark ? "#047857" : "#A7F3D0",
            }}
          >
            <Info
              stroke={isDark ? "#34D399" : "#006837"}
              size={20}
              strokeWidth={2.2}
              className="mr-3"
            />
            <Text
              className="text-[14px] font-bold"
              style={{ color: isDark ? "#34D399" : "#006837" }}
            >
              Completed by <Text className="font-black">{item.completedBy.name}</Text>
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Actions Bar */}
      <View
        className="px-5 pb-6 pt-3 border-t flex-row gap-3 items-center"
        style={{ borderTopColor: isDark ? "#253347" : "#F1F5F9" }}
      >
        <TouchableOpacity
          onPress={handleToggleStatus}
          disabled={toggleMutation.isPending}
          activeOpacity={0.88}
          className="h-14 flex-1 rounded-full flex-row items-center justify-center shadow-lg"
          style={{
            backgroundColor:
              item.status === "completed"
                ? isDark
                  ? "#1E2A3A"
                  : "#EEF4FF"
                : isDark
                  ? "#34D399"
                  : "#006837",
          }}
        >
          <Check
            stroke={
              item.status === "completed"
                ? isDark
                  ? "#34D399"
                  : "#4F46E5"
                : isDark
                  ? "#0B132B"
                  : "#FFFFFF"
            }
            size={20}
            strokeWidth={2.5}
            style={{ marginRight: 8 }}
          />
          <Text
            className="text-base font-black tracking-tight"
            style={{
              color:
                item.status === "completed"
                  ? isDark
                    ? "#34D399"
                    : "#4F46E5"
                  : isDark
                    ? "#0B132B"
                    : "#FFFFFF",
            }}
          >
            {item.status === "completed" ? "Mark as Pending" : "Mark as Completed"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate(ROUTES.EDIT_ITEM, { itemId: item.id })}
          activeOpacity={0.8}
          className="h-14 w-14 rounded-2xl items-center justify-center border shadow-xs"
          style={{
            backgroundColor: isDark ? "#17233D" : "#EEF4FF",
            borderColor: isDark ? "#253347" : "#D9E2FC",
          }}
        >
          <Edit2 stroke={isDark ? "#34D399" : "#006837"} size={22} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ItemDetailScreen;
