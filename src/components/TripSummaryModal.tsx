import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView } from "react-native";
import { CheckCircle2, ShoppingBag, X } from "lucide-react-native";
import { IGroceryItem } from "../types";

interface Props {
  visible: boolean;
  items: IGroceryItem[];
  totalSpent: number;
  onClose: () => void;
}

export const TripSummaryModal: React.FC<Props> = ({ visible, items, totalSpent, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-900/60 justify-center items-center px-6">
        <View className="w-full bg-white rounded-3xl p-6 shadow-2xl max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-100">
            <View className="flex-row items-center">
              <View className="h-10 w-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                <CheckCircle2 stroke="#059669" size={22} strokeWidth={2.5} />
              </View>
              <View>
                <Text className="text-[18px] font-black text-slate-900">Trip Complete! 🎉</Text>
                <Text className="text-[12px] font-medium text-slate-400">
                  Grocery Shopping Summary
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} className="p-1">
              <X stroke="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Banner */}
          <View className="my-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Total Spent
              </Text>
              <Text className="text-[24px] font-black text-emerald-900 mt-0.5">
                ${totalSpent.toFixed(2)}
              </Text>
            </View>
            <View className="bg-emerald-600 px-3.5 py-2 rounded-xl flex-row items-center">
              <ShoppingBag stroke="#FFF" size={14} className="mr-1.5" />
              <Text className="text-white font-extrabold text-[12px]">{items.length} Items</Text>
            </View>
          </View>

          {/* Item List Breakdown */}
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Purchased Items
          </Text>
          <ScrollView className="max-h-60" showsVerticalScrollIndicator={false}>
            {items.map((item) => {
              const price = item.actualPrice || item.estimatedTotal || item.unitPrice || 0;
              return (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between py-2.5 border-b border-slate-50"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-[14px] font-bold text-slate-800" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-[11px] font-medium text-slate-400">
                      {item.quantity ? `${item.quantity} ${item.unit || "pcs"}` : item.category}
                    </Text>
                  </View>
                  <Text className="text-[14px] font-extrabold text-slate-900">
                    ${price > 0 ? price.toFixed(2) : "0.00"}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Action Button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            className="mt-5 w-full bg-slate-900 py-3.5 rounded-2xl items-center shadow-md"
          >
            <Text className="text-white font-extrabold text-[14px]">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
