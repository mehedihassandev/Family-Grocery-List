import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Store, ExternalLink, CheckCircle2, AlertCircle, ShoppingBag } from "lucide-react-native";
import { useSuperstoreComparison, useAppTheme } from "../../hooks";

interface SuperstoreComparisonCardProps {
  itemName: string;
}

export const SuperstoreComparisonCard: React.FC<SuperstoreComparisonCardProps> = ({ itemName }) => {
  const { data: comparison, isLoading, error } = useSuperstoreComparison(itemName);
  const { colors } = useAppTheme();

  if (isLoading) {
    return (
      <View
        key="superstore-loading"
        className="rounded-xl p-4 border items-center justify-center my-2"
        style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
      >
        <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
          Comparing prices across Shwapno, Meena Bazar & Agora...
        </Text>
      </View>
    );
  }

  if (error || !comparison) {
    return null; // Graceful fallback
  }

  return (
    <View key="superstore-loaded" className="my-3 py-3">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Store size={16} color={colors.accent} className="mr-2" />
          <Text className="font-extrabold text-sm" style={{ color: colors.textPrimary }}>
            Superstore Price Compare
          </Text>
        </View>

        {comparison.savingsAmountBDT > 0 && (
          <Text className="font-bold text-xs" style={{ color: colors.accent }}>
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
            className="flex-row items-center justify-between py-2"
          >
            <View className="flex-row items-center flex-1 pr-2">
              <ShoppingBag size={14} color={colors.icon} style={{ marginRight: 8 }} />
              <View>
                <View className="flex-row items-center">
                  <Text className="font-bold text-xs mr-1.5" style={{ color: colors.textPrimary }}>
                    {store.storeName}
                  </Text>
                  {store.isBestPrice && (
                    <Text className="font-black text-[9px]" style={{ color: colors.accent }}>
                      ● BEST PRICE
                    </Text>
                  )}
                </View>

                <View className="flex-row items-center mt-0.5">
                  {store.isAvailable ? (
                    <CheckCircle2 size={10} color={colors.accent} style={{ marginRight: 4 }} />
                  ) : (
                    <AlertCircle size={10} color={colors.danger} style={{ marginRight: 4 }} />
                  )}
                  <Text className="text-[11px]" style={{ color: colors.textMuted }}>
                    {store.isAvailable ? "In Stock" : "Out of Stock"}
                  </Text>
                </View>
              </View>
            </View>

            <View className="items-end flex-row">
              <View className="items-end mr-2">
                <Text className="font-extrabold text-sm" style={{ color: colors.textPrimary }}>
                  ৳{store.priceBDT}
                </Text>
                {store.originalPriceBDT && (
                  <Text className="text-[10px] line-through" style={{ color: colors.textMuted }}>
                    ৳{store.originalPriceBDT}
                  </Text>
                )}
              </View>
              <ExternalLink size={13} color={colors.icon} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
