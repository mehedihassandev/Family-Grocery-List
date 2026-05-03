import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Check } from "lucide-react-native";
import { IGroceryItem } from "../types";
import { useDateFormatter, useTextFormatter } from "../hooks";
import { PriorityBadge } from "./ui";

interface IItemCardProps {
  item: IGroceryItem;
  onToggle: (item: IGroceryItem) => void;
  onPress: (item: IGroceryItem) => void;
  currentUserId?: string;
}

/**
 * Premium Grocery Item Card
 * Why: To display item details in the main list with a layout consistent with the new dashboard.
 * @param props - Component props including item data and interaction handlers
 */
const ItemCard = ({ item, onToggle, onPress }: IItemCardProps) => {
  const { toRelativeTime } = useDateFormatter();
  const { toInitial } = useTextFormatter();
  const isCompleted = item.status === "completed";
  const timeAgo = toRelativeTime(item.createdAt);

  return (
    <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.8} className="mb-3">
      <View className="flex-row overflow-hidden rounded-2xl bg-white shadow-sm border border-border/40 min-h-[96px]">
        {/* Priority left border accent */}
        <View
          style={{
            width: 6,
            backgroundColor: isCompleted
              ? "#E8EBF0"
              : item.priority === "Urgent"
                ? "#E55C5C"
                : item.priority === "Medium"
                  ? "#F5A623"
                  : "#10B981",
          }}
        />

        <View className="flex-1 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity
              onPress={() => onToggle(item)}
              activeOpacity={0.7}
              className="flex-row items-center flex-1 mr-3"
            >
              <View
                className={
                  "h-8 w-8 items-center justify-center rounded-xl border-2 " +
                  (isCompleted
                    ? "bg-primary-500 border-primary-500 shadow-sm shadow-primary-200"
                    : "border-border-muted bg-surface-alt")
                }
              >
                {isCompleted && <Check stroke="#FFF" size={18} strokeWidth={3} />}
              </View>
              <Text
                className={
                  "ml-4 text-[17px] font-bold flex-1 " +
                  (isCompleted ? "text-text-muted line-through opacity-60" : "text-text-primary")
                }
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>

            {!isCompleted && <PriorityBadge priority={item.priority} />}
          </View>

          <View className="flex-row items-center justify-between pl-12 mt-auto">
            <View className="flex-row items-center flex-wrap flex-1 gap-y-2">
              <View className="bg-surface-muted px-2.5 py-1 rounded-lg border border-border/60 mr-2">
                <Text className="text-[11px] font-semibold text-text-secondary">
                  {item.category} {item.quantity ? "· " + item.quantity : ""}
                </Text>
              </View>
              {item.dueDate ? (
                <View className="bg-warning-light px-2.5 py-1 rounded-lg border border-warning-light/50 mr-2">
                  <Text className="text-[11px] font-bold text-warning-dark">Due</Text>
                </View>
              ) : null}
              {item.assignee?.name ? (
                <View className="bg-primary-50 px-2.5 py-1 rounded-lg border border-primary-100 mr-2">
                  <Text className="text-[11px] font-bold text-primary-700">
                    {item.assignee.name}
                  </Text>
                </View>
              ) : null}
              <Text className="text-[11px] font-medium text-text-muted/80">{timeAgo}</Text>
            </View>

            <View className="h-7 w-7 rounded-full bg-primary-600 border-2 border-white items-center justify-center overflow-hidden shadow-sm ml-2">
              {item.addedBy.photoURL ? (
                <Image source={{ uri: item.addedBy.photoURL }} className="h-full w-full" />
              ) : (
                <Text className="text-white text-[10px] font-bold">
                  {toInitial(item.addedBy.name)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ItemCard;
