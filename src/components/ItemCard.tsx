import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react-native";
import { GroceryItem } from "../types";
import CategoryBadge from "./CategoryBadge";
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

  const priorityColors = {
    Urgent: "text-urgent",
    Medium: "text-medium",
    Low: "text-primary-600",
  };

  const priorityBg = {
    Urgent: "bg-urgent/10",
    Medium: "bg-medium/15",
    Low: "bg-primary-50",
  };

  const timeAgo = item.createdAt
    ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })
    : "just now";

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.8}
      className={`bg-surface p-5 rounded-3xl mb-4 border border-border-muted flex-row items-center shadow-sm shadow-secondary-100/40`}
      style={
        isCompleted
          ? { opacity: 0.6 }
          : {
              elevation: 2,
              shadowColor: "#516171",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
            }
      }
    >
      <TouchableOpacity
        onPress={() => onToggle(item)}
        className="mr-5"
        activeOpacity={0.6}
      >
        <View
          className={`w-8 h-8 rounded-full items-center justify-center ${isCompleted ? "bg-primary-50" : "bg-surface-muted border border-border-muted"}`}
        >
          {isCompleted ? (
            <CheckCircle2 stroke="#59AC77" size={20} strokeWidth={3} />
          ) : (
            <Circle stroke="#b8c6bd" size={20} strokeWidth={2} />
          )}
        </View>
      </TouchableOpacity>

      <View className="flex-1">
        <View className="flex-row justify-between items-start mb-1.5">
          <Text
            className={`text-lg font-bold flex-1 tracking-tight ${isCompleted ? "text-text-muted" : "text-text-primary"}`}
            style={
              isCompleted ? { textDecorationLine: "line-through" } : undefined
            }
          >
            {item.name}
            {item.quantity ? (
              <Text className="text-text-muted font-medium">
                {" "}
                ({item.quantity})
              </Text>
            ) : (
              ""
            )}
          </Text>
          {!isCompleted && item.priority === "Urgent" && (
            <View className="bg-urgent/10 p-1 rounded-lg">
              <AlertCircle stroke="#c36262" size={14} strokeWidth={2.5} />
            </View>
          )}
        </View>

        <View className="flex-row items-center flex-wrap gap-2">
          <CategoryBadge category={item.category} />
          <View
            className={`px-2.5 py-0.5 rounded-full ${priorityBg[item.priority]}`}
          >
            <Text
              className={`text-[10px] font-extrabold uppercase tracking-widest ${priorityColors[item.priority]}`}
            >
              {item.priority}
            </Text>
          </View>
          <View className="flex-row items-center ml-auto">
            <Clock stroke="#95a39a" size={10} className="mr-1" />
            <Text className="text-[10px] text-text-muted font-medium">
              {timeAgo}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mt-3 pt-3 border-t border-border-muted">
          <View className="w-5 h-5 bg-surface-subtle rounded-full items-center justify-center mr-2">
            <Text className="text-[8px] font-bold text-text-secondary">
              {item.addedBy.name.charAt(0)}
            </Text>
          </View>
          <Text className="text-[10px] text-text-muted">
            Added by{" "}
            <Text className="font-bold text-text-secondary">
              {currentUserId && item.addedBy.uid === currentUserId
                ? "You"
                : item.addedBy.name}
            </Text>
          </Text>
        </View>

        {isCompleted && item.completedBy && (
          <View className="flex-row items-center mt-2 bg-primary-50/60 p-2 rounded-xl">
            <View className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2" />
            <Text className="text-[10px] text-primary-700 font-semibold">
              Completed by {item.completedBy.name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ItemCard;
