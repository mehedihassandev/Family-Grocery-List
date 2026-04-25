import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { X, Edit2, Calendar, User, ShoppingBasket, AlignLeft, Info } from "lucide-react-native";
import { IGroceryItem } from "../types";
import { GroceryPriority } from "../features/grocery";
import { Card, Chip, PriorityBadge } from "./ui";

interface IItemDetailModalProps {
  visible: boolean;
  item: IGroceryItem | null;
  onClose: () => void;
  onEdit: (item: IGroceryItem) => void;
}

/**
 * Formats a Firestore timestamp or date value to a readable string
 * @param dateValue - The date value to format
 */
const formatDate = (dateValue: any) => {
  if (!dateValue) return "Unknown";
  const dateStr =
    dateValue?.toDate?.()?.toLocaleDateString() || new Date(dateValue).toLocaleDateString();
  return dateStr !== "Invalid Date" ? dateStr : "Unknown";
};

/**
 * Modal to display detailed information about a grocery item
 * Why: To provide a deep dive into item specifics (who added it, when, notes, etc.) without cluttering the main list.
 * @param props - Component props including visibility, item data, and handlers
 */
const ItemDetailModal = ({ visible, item, onClose, onEdit }: IItemDetailModalProps) => {
  if (!item) return null;

  const modelPriority: GroceryPriority =
    item.priority === "Urgent" ? "urgent" : item.priority === "Medium" ? "medium" : "low";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute bottom-0 left-0 right-0 top-0"
        />

        <View
          className="max-h-[85%] min-h-[50%] rounded-t-4xl bg-background px-6 pb-12 pt-3"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          {/* Handle bar */}
          <View className="mb-4 items-center">
            <View className="h-1 w-9 rounded-full bg-handle" />
          </View>

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
                  onPress={() => {}} // Read-only chip here
                />
                {item.status === "pending" ? <PriorityBadge priority={modelPriority} /> : null}
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => onEdit(item)}
                activeOpacity={0.7}
                className="h-11 w-11 items-center justify-center rounded-full bg-primary-600 shadow-sm"
              >
                <Edit2 stroke="white" size={18} strokeWidth={3} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
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
                    {formatDate(item.createdAt)}
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
                  <Text className="text-[15px] leading-relaxed text-text-primary">
                    {item.notes}
                  </Text>
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
    </Modal>
  );
};

export default ItemDetailModal;
