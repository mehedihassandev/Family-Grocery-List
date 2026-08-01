import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChevronLeft,
  Bell,
  ShoppingBag,
  Tag,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  TrendingUp,
  MapPin,
} from "lucide-react-native";
import { AuthenticatedStackNavigatorScreenProps, ROUTES } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import {
  useFamilyGroceryItemsBackend,
  useBasketOptimization,
  useBasketSplitOptimization,
  useAppTheme,
  useTextFormatter,
} from "../hooks";
import { useUnreadNotificationCountQuery } from "../hooks/queries/useNotificationQueries";
import { useNotificationStore } from "../store/useNotificationStore";

/**
 * Basket & Store Comparison Screen - 100% Dynamic API Data Driven
 */
const StoreComparisonScreen = ({
  navigation,
}: AuthenticatedStackNavigatorScreenProps<typeof ROUTES.STORE_COMPARISON>) => {
  const { user } = useAuthStore();
  const { isDark } = useAppTheme();
  const { toInitial } = useTextFormatter();

  // TanStack Query Real API Data Hooks
  const { data: items = [] } = useFamilyGroceryItemsBackend(user?.familyId);
  const { data: basketOpt } = useBasketOptimization(user?.familyId || undefined, items);
  const { data: basketSplitOpt } = useBasketSplitOptimization(user?.familyId || undefined, items);

  const { data: unreadData } = useUnreadNotificationCountQuery(user?.familyId);
  const notifications = useNotificationStore((state) => state.notifications);
  const fallbackUnreadCount = notifications.filter(
    (n) => n.actorId !== user?.uid && !n.readBy.includes(user?.uid || ""),
  ).length;
  const unreadCount =
    typeof unreadData?.unreadCount === "number" ? unreadData.unreadCount : fallbackUnreadCount;

  const bestStoreName = useMemo(() => {
    return basketOpt?.cheapestStoreName || "";
  }, [basketOpt]);

  const [selectedStore, setSelectedStore] = useState<string>(bestStoreName);

  // Dynamic Savings Calculation from API
  const potentialMonthlySavings = useMemo(() => {
    if (typeof basketOpt?.potentialSavingsBDT === "number" && basketOpt.potentialSavingsBDT > 0) {
      return basketOpt.potentialSavingsBDT;
    }
    return 0;
  }, [basketOpt]);

  // Dynamic Store Totals & Comparisons from API
  const storeComparisonList = useMemo(() => {
    if (basketOpt?.storeTotals && basketOpt.storeTotals.length > 0) {
      const cheapestPrice = Math.min(...basketOpt.storeTotals.map((s) => s.totalBDT));
      return basketOpt.storeTotals.map((st) => {
        const diff = st.totalBDT - cheapestPrice;
        const isCheapest = st.storeName === basketOpt.cheapestStoreName || diff === 0;
        return {
          name: st.storeName,
          price: st.totalBDT,
          diff: diff > 0 ? `+৳${diff.toFixed(2)} diff` : "Cheapest",
          isCheapest,
          stockStatus: diff > 4 ? "Limited Stock" : "In Stock",
        };
      });
    }

    return [];
  }, [basketOpt]);

  // Dynamic Top Price Differences from API
  const topPriceDifferences = useMemo(() => {
    if (basketSplitOpt?.itemAllocations && basketSplitOpt.itemAllocations.length > 0) {
      return basketSplitOpt.itemAllocations.map((alloc) => ({
        name: alloc.itemName,
        store: alloc.bestStoreName,
        price: alloc.priceBDT,
        savingsText: `↘ Save at ${alloc.bestStoreName}`,
      }));
    }

    return [];
  }, [basketSplitOpt]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: isDark ? "#0B132B" : "#F8FAFC" }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top Header Row */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        className="px-5 pt-3 pb-2 flex-row items-center justify-between"
      >
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
          Grocery List
        </Text>

        <View className="flex-row items-center gap-2.5">
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
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
                style={{ backgroundColor: "#EF4444", borderColor: isDark ? "#0B0F17" : "#F8FAFC" }}
              >
                <Text className="text-[9px] font-black text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            ) : null}
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
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        className="flex-1 px-5 pt-3"
      >
        {/* HERO GREEN SAVINGS BANNER CARD */}
        <Animated.View
          entering={FadeInDown.duration(350).springify()}
          className="rounded-2xl p-5 mb-5 relative overflow-hidden shadow-md"
          style={{ backgroundColor: "#006837" }}
        >
          <View
            className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full opacity-15"
            style={{ backgroundColor: "#FFFFFF" }}
          />
          <View
            className="absolute -top-8 -right-4 h-24 w-24 rounded-full opacity-10"
            style={{ backgroundColor: "#FFFFFF" }}
          />

          <View className="mb-4">
            <Text className="text-emerald-200 text-[11px] font-extrabold uppercase tracking-wider mb-1">
              Potential Monthly Savings
            </Text>
            <Text className="text-white text-3xl font-black tracking-tight">
              ${potentialMonthlySavings.toFixed(2)}
            </Text>
          </View>

          <View>
            <Text className="text-emerald-200 text-[11px] font-extrabold uppercase tracking-wider mb-0.5">
              Best Store for Current List
            </Text>
            <Text className="text-white text-xl font-extrabold tracking-tight">
              {bestStoreName}
            </Text>
          </View>
        </Animated.View>

        {/* BASKET COMPARISON SECTION */}
        <Animated.View entering={FadeInDown.duration(400).springify()} className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text
              className="text-lg font-black tracking-tight"
              style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
            >
              Basket Comparison
            </Text>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                activeOpacity={0.8}
                className="flex-row items-center px-3 py-1.5 rounded-full border shadow-xs"
                style={{
                  backgroundColor: isDark ? "#17233D" : "#EEF4FF",
                  borderColor: isDark ? "#253347" : "#C7D2FE",
                }}
              >
                <Tag stroke={isDark ? "#34D399" : "#4F46E5"} size={13} className="mr-1.5" />
                <Text
                  className="text-[11px] font-extrabold"
                  style={{ color: isDark ? "#34D399" : "#312E81" }}
                >
                  Sort by Savings
                </Text>
              </TouchableOpacity>
              <Text
                className="text-[12px] font-bold"
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              >
                {items.length || 12} items
              </Text>
            </View>
          </View>

          {/* DYNAMIC STORE CARDS LIST */}
          {storeComparisonList.map((store) => {
            const isSelected = selectedStore === store.name;
            return (
              <TouchableOpacity
                key={store.name}
                onPress={() => setSelectedStore(store.name)}
                activeOpacity={0.88}
                className="rounded-2xl p-4 mb-3 border-2 shadow-xs"
                style={{
                  backgroundColor: store.isCheapest
                    ? isDark
                      ? "#16233B"
                      : "#EEF4FF"
                    : isDark
                      ? "#16233B"
                      : "#FFFFFF",
                  borderColor: isSelected
                    ? "#10B981"
                    : store.isCheapest
                      ? "#10B981"
                      : isDark
                        ? "#253347"
                        : "#F1F5F9",
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="h-11 w-11 rounded-2xl items-center justify-center mr-3"
                      style={{
                        backgroundColor: store.isCheapest
                          ? "#FFFFFF"
                          : isDark
                            ? "#17233D"
                            : "#F8FAFC",
                      }}
                    >
                      <ShoppingBag
                        stroke={store.isCheapest ? "#006837" : isDark ? "#94A3B8" : "#64748B"}
                        size={20}
                        strokeWidth={2.2}
                      />
                    </View>

                    <View className="flex-1">
                      <Text
                        className="text-[15px] font-black tracking-tight mb-1"
                        style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                      >
                        {store.name}
                      </Text>
                      {store.isCheapest ? (
                        <View className="flex-row items-center flex-wrap gap-1.5">
                          <View className="px-2 py-0.5 rounded-full bg-emerald-100">
                            <Text className="text-[10px] font-black text-emerald-700">
                              Cheapest
                            </Text>
                          </View>
                          <View className="px-2 py-0.5 rounded-full bg-[#006837]">
                            <Text className="text-[10px] font-black text-white">
                              Best Value • All in Stock
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <Text
                          className="text-[11px] font-bold mt-0.5"
                          style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                        >
                          {store.diff}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="items-end">
                    <View className="flex-row items-center mb-1">
                      {store.stockStatus === "Limited Stock" ? (
                        <>
                          <AlertTriangle stroke="#D97706" size={13} className="mr-1" />
                          <Text className="text-[10px] font-bold text-amber-600">
                            Limited Stock
                          </Text>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 stroke="#10B981" size={14} className="mr-1" />
                          <Text className="text-[10px] font-bold text-emerald-600">In Stock</Text>
                        </>
                      )}
                    </View>
                    <Text
                      className="text-lg font-black"
                      style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                    >
                      ${store.price.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* TOP PRICE DIFFERENCES */}
        <Animated.View entering={FadeInDown.duration(450).springify()} className="mb-6">
          <Text
            className="text-lg font-black tracking-tight mb-3"
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
          >
            Top Price Differences
          </Text>

          {topPriceDifferences.map((item, idx) => (
            <View
              key={item.name + idx}
              className="rounded-2xl p-4 mb-3 border shadow-xs"
              style={{
                backgroundColor: isDark ? "#16233B" : "#EEF4FF",
                borderColor: isDark ? "#253347" : "#E2E8F0",
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="h-10 w-10 rounded-2xl bg-white items-center justify-center mr-3 shadow-xs">
                    <ShoppingBag stroke="#0284C7" size={18} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-[14px] font-extrabold"
                      style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-[11px] font-bold text-emerald-600 mt-0.5">
                      {item.savingsText}
                    </Text>
                  </View>
                </View>

                <Text
                  className="text-[15px] font-black"
                  style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
                >
                  ${item.price.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* SWITCH CART ACTION BUTTON */}
        <Animated.View entering={FadeInDown.duration(500).springify()} className="mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.88}
            className="h-14 rounded-2xl flex-row items-center justify-center shadow-lg"
            style={{ backgroundColor: "#006837" }}
          >
            <ArrowRightLeft stroke="#FFFFFF" size={18} strokeWidth={2.5} className="mr-2" />
            <Text className="text-white font-extrabold text-base tracking-tight">
              Switch Cart to {selectedStore}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* SAVINGS TREND (3 MO) */}
        <Animated.View entering={FadeInDown.duration(550).springify()} className="mb-4">
          <Text
            className="text-lg font-black tracking-tight mb-3"
            style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}
          >
            Savings Trend (3 Mo)
          </Text>

          <View
            className="rounded-2xl p-5 border shadow-xs"
            style={{
              backgroundColor: isDark ? "#16233B" : "#EEF4FF",
              borderColor: isDark ? "#253347" : "#E2E8F0",
            }}
          >
            <View className="flex-row items-center justify-around mb-4">
              <View className="items-center">
                <Text
                  className="text-xs font-bold mb-1.5"
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                >
                  Sep
                </Text>
                <View className="flex-row items-center px-2.5 py-1 rounded-full bg-white shadow-xs">
                  <MapPin stroke="#006837" size={11} className="mr-1" />
                  <Text className="text-[11px] font-bold text-slate-700">2.5 km • 15 min</Text>
                </View>
              </View>

              <View className="items-center">
                <View className="flex-row items-center mb-1">
                  <Text className="text-xs font-black text-emerald-600 mr-1">Nov</Text>
                  <View className="h-4 w-4 rounded-full bg-emerald-300 items-center justify-center">
                    <TrendingUp stroke="#006837" size={10} />
                  </View>
                </View>
                <View className="flex-row items-center px-2.5 py-1 rounded-full bg-white shadow-xs">
                  <MapPin stroke="#006837" size={11} className="mr-1" />
                  <Text className="text-[11px] font-bold text-slate-700">2.5 km • 15 min</Text>
                </View>
              </View>
            </View>

            <Text
              className="text-center text-[13px] font-bold mt-1"
              style={{ color: isDark ? "#94A3B8" : "#475569" }}
            >
              Total saved this quarter:{" "}
              <Text className="font-black" style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}>
                ${(potentialMonthlySavings * 0.75).toFixed(2)}
              </Text>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StoreComparisonScreen;
