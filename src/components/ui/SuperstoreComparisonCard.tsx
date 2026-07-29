import React from "react";
import { View, Text, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { Store, ExternalLink, CheckCircle2, AlertCircle, ShoppingBag } from "lucide-react-native";
import { useSuperstoreComparison } from "../../hooks";

interface SuperstoreComparisonCardProps {
  itemName: string;
}

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
    <View key="superstore-loaded" className="my-3 py-3 border-b border-slate-100">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Store size={16} color="#059669" className="mr-2" />
          <Text className="text-slate-900 font-extrabold text-sm">Superstore Price Compare</Text>
        </View>

        {comparison.savingsAmountBDT > 0 && (
          <Text className="text-emerald-700 font-bold text-xs">
            Save up to ৳{comparison.savingsAmountBDT}
          </Text>
        )}
      </View>

      {/* Store Price Rows */}
      {comparison.storePrices?.map((store, index) => {
        return (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => store.itemUrl && Linking.openURL(store.itemUrl)}
            className="flex-row items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
          >
            <View className="flex-row items-center flex-1 pr-2">
              <ShoppingBag size={14} color="#475569" style={{ marginRight: 8 }} />
              <View>
                <View className="flex-row items-center">
                  <Text className="font-bold text-slate-800 text-xs mr-1.5">{store.storeName}</Text>
                  {store.isBestPrice && (
                    <Text className="text-emerald-600 font-black text-[9px]">● BEST PRICE</Text>
                  )}
                </View>

                <View className="flex-row items-center mt-0.5">
                  {store.isAvailable ? (
                    <CheckCircle2 size={10} color="#10B981" style={{ marginRight: 4 }} />
                  ) : (
                    <AlertCircle size={10} color="#EF4444" style={{ marginRight: 4 }} />
                  )}
                  <Text className="text-slate-400 text-[11px]">
                    {store.isAvailable ? "In Stock" : "Out of Stock"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="items-end flex-row">
              <View className="items-end mr-2">
                <Text className="font-extrabold text-slate-900 text-sm">৳{store.priceBDT}</Text>
                {store.originalPriceBDT && (
                  <Text className="text-slate-400 text-[10px] line-through">
                    ৳{store.originalPriceBDT}
                  </Text>
                )}
              </View>
              <ExternalLink size={13} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
