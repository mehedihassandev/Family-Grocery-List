import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react-native";
import { GroceryItem } from "../types";
import { formatDistanceToNow } from "date-fns";

interface ItemCardProps {
  item: GroceryItem;
  onToggle: (item: GroceryItem) => void;
  onPress: (item: GroceryItem) => void;
  currentUserId?: string;
}

const ItemCard = ({
  item,
  onToggle,
  onPress,
  currentUserId,
}: ItemCardProps) => {
  const isCompleted = item.status === "completed";

  const timeAgo = item.createdAt
    ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })
    : "just now";

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.8}
      className="mb-1 flex-row items-start border-b border-border-muted px-1 py-3.5"
      style={isCompleted ? { opacity: 0.6 } : undefined}
    >
      <TouchableOpacity
        onPress={() => onToggle(item)}
        className="mr-4 mt-0.5"
        activeOpacity={0.6}
      >
        <View
          className={`h-8 w-8 items-center justify-center rounded-full ${isCompleted ? "bg-primary-50" : "border border-border-muted bg-surface"}`}
        >
          {isCompleted ? (
            <CheckCircle2 stroke="#59AC77" size={19} strokeWidth={2.8} />
          ) : (
            <Circle stroke="#b8c6bd" size={19} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>

      <View className="flex-1">
        <View className="mb-1 flex-row items-start justify-between">
          <Text
            className={`flex-1 text-[18px] font-semibold tracking-tight ${isCompleted ? "text-text-muted" : "text-text-primary"}`}
            style={
              isCompleted ? { textDecorationLine: "line-through" } : undefined
            }
          >
            {item.name}
            {item.quantity ? (
              <Text className="text-[15px] font-medium text-text-muted">
                {" "}
                ({item.quantity})
              </Text>
            ) : (
              ""
            )}
          </Text>
          {!isCompleted && item.priority === "Urgent" && (
            <View className="rounded-lg bg-urgent/10 p-1">
              <AlertCircle stroke="#c36262" size={14} strokeWidth={2.5} />
            </View>
          )}
        </View>

        <View className="flex-row items-center">
          <Text className="text-[12px] text-text-secondary">
            {item.category} · {item.priority}
          </Text>
          <View className="ml-auto flex-row items-center">
            <Clock stroke="#95a39a" size={10} />
            <Text className="ml-1 text-[11px] font-medium text-text-muted">
              {timeAgo}
            </Text>
          </View>
        </View>

        {item.notes?.trim() ? (
          <Text className="mt-1 text-[13px] leading-5 text-text-secondary">
            {item.notes}
          </Text>
        ) : null}

        <View className="mt-2 flex-row items-center">
          <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-surface-subtle">
            <Text className="text-[9px] font-bold text-text-secondary">
              {item.addedBy.name.charAt(0)}
            </Text>
          </View>
          <Text className="text-[11px] text-text-muted">
            Added by{" "}
            <Text className="font-bold text-text-secondary">
              {currentUserId && item.addedBy.uid === currentUserId
                ? "You"
                : item.addedBy.name}
            </Text>
          </Text>
        </View>

        {isCompleted && item.completedBy && (
          <View className="mt-1 flex-row items-center">
            <View className="mr-2 h-1.5 w-1.5 rounded-full bg-primary-500" />
            <Text className="text-[11px] font-semibold text-primary-700">
              Completed by {item.completedBy.name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ItemCard;
