import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { CheckCircle2, Circle, Clock } from "lucide-react-native";
import { GroceryItem } from "../types";
import { formatDistanceToNow } from "date-fns";
import { GroceryPriority } from "../features/grocery";
import { Card, PriorityBadge } from "./ui";
import { useColorScheme } from "nativewind";

interface ItemCardProps {
  item: GroceryItem;
  onToggle: (item: GroceryItem) => void;
  onPress: (item: GroceryItem) => void;
  currentUserId?: string;
}

/**
 * Individual grocery list item card
 * Why: To display item details and allow for status toggling in a clean, consistent way.
 */
const ItemCard = ({ item, onToggle, onPress, currentUserId }: ItemCardProps) => {
  const { colorScheme } = useColorScheme();
  const isCompleted = item.status === "completed";
  const isDark = colorScheme === "dark";

  const timeAgo = item.createdAt
    ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })
    : "just now";

  const modelPriority: GroceryPriority =
    item.priority === "Urgent" ? "urgent" : item.priority === "Medium" ? "medium" : "low";

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.8}
      className="mb-4"
      style={isCompleted ? { opacity: 0.6 } : undefined}
    >
      <Card padding={false} className="flex-row overflow-hidden min-h-[80px]">
        {/* Priority left border accent */}
        <View 
          style={{ 
            width: 4, 
            backgroundColor: isCompleted 
              ? "#9AA3AF" 
              : modelPriority === "urgent" 
                ? "#E55C5C" 
                : modelPriority === "medium" 
                  ? "#F5A623" 
                  : "#3DB87A" 
          }} 
        />

        <View className="flex-1 flex-row items-center p-4">
          <TouchableOpacity onPress={() => onToggle(item)} className="mr-4" activeOpacity={0.6}>
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${
                isCompleted
                  ? "bg-primary-100"
                  : "border-2 border-border bg-surface"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 stroke="#3DB87A" size={14} strokeWidth={3} />
              ) : null}
            </View>
          </TouchableOpacity>

          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                className={`text-[15px] font-bold ${
                  isCompleted
                    ? "text-text-muted"
                    : "text-text-900"
                }`}
                style={isCompleted ? { textDecorationLine: "line-through" } : undefined}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              
              {item.quantity ? (
                <View className="ml-2 px-2 py-0.5 rounded-sm bg-primary-100">
                  <Text className="text-[11px] font-bold uppercase text-primary-600">
                    {item.quantity}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center mt-2">
              <View className="px-2 py-0.5 rounded-sm bg-surface-muted border border-border">
                <Text className="text-[11px] font-bold text-text-secondary">
                  {item.category}
                </Text>
              </View>
              
              <Text className="ml-3 text-[11px] font-medium text-text-muted">
                {timeAgo}
              </Text>
            </View>
          </View>

          <View className="h-6 w-6 rounded-full bg-surface-alt border border-border items-center justify-center ml-2 overflow-hidden">
            {item.addedBy.photoURL ? (
              <Image source={{ uri: item.addedBy.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-[10px] font-bold text-text-muted">
                {item.addedBy.name.charAt(0)}
              </Text>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export default ItemCard;
