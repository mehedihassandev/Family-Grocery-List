import React from "react";
import { View, Text, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { Store, ExternalLink, CheckCircle2, AlertCircle, ShoppingBag } from "lucide-react-native";
import { useSuperstoreComparison } from "../../hooks";
import { ESuperstore } from "../../types/superstore";

interface SuperstoreComparisonCardProps {
  itemName: string;
}

const STORE_COLORS: Record<ESuperstore, { bg: string; text: string; border: string }> = {
  Shwapno: { bg: "#FEF2F2", text: "#DC2626", border: "#FCA5A5" },
  "Meena Bazar": { bg: "#ECFDF5", text: "#059669", border: "#6EE7B7" },
  Agora: { bg: "#EFF6FF", text: "#2563EB", border: "#93C5FD" },
};

export const SuperstoreComparisonCard: React.FC<SuperstoreComparisonCardProps> = ({ itemName }) => {
  const { data: comparison, isLoading, error } = useSuperstoreComparison(itemName);

  if (isLoading) {
    return (
      <View
        key="superstore-loading"
        className="bg-white rounded-2xl p-4 border border-slate-100 items-center justify-center my-2"
      >
        <ActivityIndicator size="small" color="#10B981" />
        <Text className="text-slate-400 text-xs mt-2 font-medium">
          Comparing prices across Shwapno, Meena Bazar & Agora...
        </Text>
      </View>
    );
  }

  if (error || !comparison) {
    return null; // Graceful fallback
  }

  return (
    <View
      key="superstore-loaded"
      className="bg-white rounded-2xl p-4 border border-slate-100 my-2 shadow-sm"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-emerald-50 items-center justify-center mr-2">
            <Store size={18} color="#10B981" />
          </View>
          <View>
            <Text className="text-slate-900 font-bold text-sm">Superstore Price Compare</Text>
            <Text className="text-slate-400 text-xs">Shwapno • Meena Bazar • Agora</Text>
          </View>
        </View>

        {comparison.savingsAmountBDT > 0 && (
          <View className="bg-emerald-100 px-2.5 py-1 rounded-full">
            <Text className="text-emerald-700 font-bold text-xs">
              Save up to ৳{comparison.savingsAmountBDT}
            </Text>
          </View>
        )}
      </View>

      {/* Store Price Rows */}
      {comparison.storePrices?.map((store, index) => {
        const theme = STORE_COLORS[store.storeName] || {
          bg: "#F8FAFC",
          text: "#475569",
          border: "#E2E8F0",
        };

        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => store.itemUrl && Linking.openURL(store.itemUrl)}
            className="flex-row items-center justify-between py-2.5 px-3 rounded-xl mb-2 border"
            style={{ backgroundColor: theme.bg, borderColor: theme.border }}
          >
            <View className="flex-row items-center flex-1 pr-2">
              <ShoppingBag size={16} color={theme.text} style={{ marginRight: 8 }} />
              <View>
                <View className="flex-row items-center">
                  <Text className="font-bold text-slate-800 text-sm mr-1.5">{store.storeName}</Text>
                  {store.isBestPrice && (
                    <View className="bg-emerald-600 px-1.5 py-0.5 rounded">
                      <Text className="text-white font-bold text-[10px]">BEST PRICE</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center mt-0.5">
                  {store.isAvailable ? (
                    <CheckCircle2 size={12} color="#10B981" style={{ marginRight: 4 }} />
                  ) : (
                    <AlertCircle size={12} color="#EF4444" style={{ marginRight: 4 }} />
                  )}
                  <Text className="text-slate-500 text-xs">
                    {store.isAvailable ? "In Stock" : "Out of Stock"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="items-end flex-row">
              <View className="items-end mr-2">
                <Text className="font-extrabold text-slate-900 text-base">৳{store.priceBDT}</Text>
                {store.originalPriceBDT && (
                  <Text className="text-slate-400 text-[10px] line-through">
                    ৳{store.originalPriceBDT}
                  </Text>
                )}
              </View>
              <ExternalLink size={14} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
