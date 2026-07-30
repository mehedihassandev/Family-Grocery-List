import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView } from "react-native";
import { CheckCircle2, ShoppingBag, X } from "lucide-react-native";
import { IGroceryItem } from "../types";
import { useAppTheme } from "../hooks/useAppTheme";

interface Props {
  visible: boolean;
  items: IGroceryItem[];
  totalSpent: number;
  onClose: () => void;
}

export const TripSummaryModal: React.FC<Props> = ({ visible, items, totalSpent, onClose }) => {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <View
          className="w-full rounded-xl p-6 shadow-2xl border max-h-[80%]"
          style={{ backgroundColor: colors.bgCard, borderColor: colors.border }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4">
            <View className="flex-row items-center">
              <View
                className="h-10 w-10 rounded-full items-center justify-center mr-3 border"
                style={{ backgroundColor: colors.accentLightSubtle, borderColor: colors.border }}
              >
                <CheckCircle2 stroke={colors.accent} size={22} strokeWidth={2.5} />
              </View>
              <View>
                <Text className="text-[18px] font-black" style={{ color: colors.textPrimary }}>
                  Trip Complete! 🎉
                </Text>
                <Text className="text-[12px] font-medium" style={{ color: colors.textMuted }}>
                  Grocery Shopping Summary
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="p-1">
              <X stroke={colors.icon} size={20} />
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Banner */}
          <View
            className="my-4 border rounded-xl p-4 flex-row items-center justify-between"
            style={{ backgroundColor: colors.bgInput, borderColor: colors.border }}
          >
            <View>
              <Text
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: colors.accent }}
              >
                Total Spent
              </Text>
              <Text className="text-[24px] font-black mt-0.5" style={{ color: colors.accent }}>
                ৳{totalSpent.toFixed(2)}
              </Text>
            </View>
            <View
              className="px-3.5 py-2 rounded-xl flex-row items-center"
              style={{ backgroundColor: colors.accent }}
            >
              <ShoppingBag stroke={colors.white} size={14} className="mr-1.5" />
              <Text className="text-white font-extrabold text-[12px]">{items.length} Items</Text>
            </View>
          </View>

          {/* Item List Breakdown */}
          <Text
            className="text-[11px] font-bold uppercase tracking-wider mb-2"
            style={{ color: colors.textMuted }}
          >
            Purchased Items
          </Text>
          <ScrollView className="max-h-60" showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const price = item.actualPrice || item.estimatedTotal || item.unitPrice || 0;
              return (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between py-2.5 border-b"
                  style={{ borderBottomColor: colors.border }}
                >
                  <View className="flex-1 pr-2">
                    <Text
                      className="text-[14px] font-bold"
                      numberOfLines={1}
                      style={{ color: colors.textPrimary }}
                    >
                      {item.name}
                    </Text>
                    <Text className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                      {item.quantity ? `${item.quantity} ${item.unit || "pcs"}` : item.category}
                    </Text>
                  </View>
                  <Text
                    className="text-[14px] font-extrabold"
                    style={{ color: colors.textPrimary }}
                  >
                    ৳{price > 0 ? price.toFixed(2) : "0.00"}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Action Button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            className="mt-5 w-full py-3.5 rounded-xl items-center shadow-md"
            style={{ backgroundColor: colors.accent }}
          >
            <Text className="text-white font-extrabold text-[14px]">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
