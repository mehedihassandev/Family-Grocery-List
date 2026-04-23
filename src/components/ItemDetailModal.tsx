import React from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  X,
  Edit2,
  Calendar,
  User,
  ShoppingBasket,
  AlignLeft,
} from "lucide-react-native";
import { GroceryItem } from "../types";

type ItemDetailModalProps = {
  visible: boolean;
  item: GroceryItem | null;
  onClose: () => void;
  onEdit: (item: GroceryItem) => void;
};

const formatDate = (dateValue: any) => {
  if (!dateValue) return "Unknown";
  const dateStr =
    dateValue?.toDate?.()?.toLocaleDateString() ||
    new Date(dateValue).toLocaleDateString();
  return dateStr !== "Invalid Date" ? dateStr : "Unknown";
};

const ItemDetailModal = ({
  visible,
  item,
  onClose,
  onEdit,
}: ItemDetailModalProps) => {
  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute bottom-0 left-0 right-0 top-0"
        />

        <View
          className="max-h-[85%] min-h-[60%] rounded-t-3xl bg-surface px-6 pb-12 pt-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 15,
          }}
        >
          {/* Handle bar */}
          <View className="mb-4 items-center">
            <View className="h-1.5 w-12 rounded-full bg-border-muted" />
          </View>

          <View className="mb-6 flex-row items-start justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-[12px] font-bold uppercase tracking-[1.5px] text-primary-600">
                Item Details
              </Text>
              <Text className="mt-1 text-[28px] font-black tracking-tight text-text-primary">
                {item.name}
              </Text>
              <View className="mt-2 flex-row flex-wrap items-center gap-2">
                <View
                  className={`rounded-full px-3 py-1 ${
                    item.status === "completed"
                      ? "bg-primary-50"
                      : "bg-surface border border-border-muted"
                  }`}
                >
                  <Text
                    className={`text-[12px] font-semibold ${
                      item.status === "completed"
                        ? "text-primary-700"
                        : "text-text-secondary"
                    }`}
                  >
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
                {item.priority === "Urgent" && (
                  <View className="rounded-full bg-urgent/10 px-3 py-1">
                    <Text className="text-[12px] font-semibold text-urgent">
                      Urgent
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => onEdit(item)}
                activeOpacity={0.8}
                className="rounded-full border border-primary-200 bg-primary-50 p-2.5"
              >
                <Edit2 stroke="#59AC77" size={20} strokeWidth={2.2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="rounded-full bg-border-subtle p-2.5"
              >
                <X stroke="#637889" size={20} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-4 rounded-2xl border border-border-muted bg-surface p-5">
              <View className="mb-4 flex-row items-center border-b border-border-muted pb-4">
                <View className="mr-4 rounded-xl bg-primary-50 p-2">
                  <ShoppingBasket stroke="#59AC77" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] font-semibold text-text-muted">
                    Category
                  </Text>
                  <Text className="text-[16px] font-semibold text-text-primary">
                    {item.category || "Uncategorized"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] font-semibold text-text-muted">
                    Quantity
                  </Text>
                  <Text className="text-[16px] font-semibold text-text-primary">
                    {item.quantity ? `${item.quantity} ${item.unit || ""}` : "—"}
                  </Text>
                </View>
              </View>

              <View className="mb-4 flex-row items-center border-b border-border-muted pb-4">
                <View className="mr-4 rounded-xl bg-primary-50 p-2">
                  <User stroke="#59AC77" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] font-semibold text-text-muted">
                    Added By
                  </Text>
                  <Text className="text-[16px] font-semibold text-text-primary">
                    {item.addedBy?.name || "Unknown"}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="mr-4 rounded-xl bg-primary-50 p-2">
                  <Calendar stroke="#59AC77" size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-[12px] font-semibold text-text-muted">
                    Created At
                  </Text>
                  <Text className="text-[16px] font-semibold text-text-primary">
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            {item.notes ? (
              <View className="mb-4 rounded-2xl border border-border-muted bg-surface p-5">
                <View className="mb-2 flex-row items-center">
                  <AlignLeft stroke="#637889" size={18} className="mr-2" />
                  <Text className="text-[14px] font-bold text-text-secondary">
                    Notes
                  </Text>
                </View>
                <Text className="text-[15px] leading-6 text-text-primary">
                  {item.notes}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ItemDetailModal;
