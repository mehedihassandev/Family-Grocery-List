import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { IGroceryItem } from "../types";
import { useDateFormatter, useTextFormatter } from "../hooks";
import { Card, PriorityBadge } from "./ui";

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
    <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.8} className="mb-4">
      <Card padding={false} className="flex-row overflow-hidden min-h-[100px]">
        {/* Priority left border accent */}
        <View
          style={{
            width: 5,
            backgroundColor: isCompleted
              ? "#E8EBF0"
              : item.priority === "Urgent"
                ? "#E55C5C"
                : item.priority === "Medium"
                  ? "#F5A623"
                  : "#3DB87A",
          }}
        />

        <View className="flex-1 p-5">
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity
              onPress={() => onToggle(item)}
              activeOpacity={0.6}
              className="flex-row items-center flex-1 mr-2"
            >
              <View
                className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                  isCompleted ? "bg-primary-500 border-primary-500" : "border-border bg-white"
                }`}
              >
                {isCompleted && <CheckCircle2 stroke="#FFF" size={14} strokeWidth={3} />}
              </View>
              <Text
                className={`ml-3 text-[17px] font-bold flex-1 ${
                  isCompleted ? "text-text-muted line-through" : "text-text-primary"
                }`}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>

            {!isCompleted && <PriorityBadge priority={item.priority} />}
          </View>

          <View className="flex-row items-center justify-between mt-auto">
            <View className="flex-row items-center">
              <View className="bg-surface-muted px-2 py-1 rounded-md border border-border/50">
                <Text className="text-[11px] font-bold text-text-secondary">
                  {item.category} {item.quantity ? `· ${item.quantity}` : ""}
                </Text>
              </View>
              {item.dueDate ? (
                <View className="ml-2 bg-warning-light px-2 py-1 rounded-md border border-warning-light">
                  <Text className="text-[10px] font-bold text-warning-dark">Due</Text>
                </View>
              ) : null}
              {item.assignee?.name ? (
                <View className="ml-2 bg-primary-50 px-2 py-1 rounded-md border border-primary-100">
                  <Text className="text-[10px] font-bold text-primary-700">
                    {item.assignee.name}
                  </Text>
                </View>
              ) : null}
              <Text className="ml-3 text-[11px] font-medium text-text-muted">{timeAgo}</Text>
            </View>

            <View className="h-7 w-7 rounded-full bg-primary-600 border-2 border-white items-center justify-center overflow-hidden shadow-sm">
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
      </Card>
    </TouchableOpacity>
  );
};

export default ItemCard;
