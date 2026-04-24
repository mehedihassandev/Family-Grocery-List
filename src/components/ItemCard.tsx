import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react-native";
import { GroceryItem } from "../types";
import { formatDistanceToNow } from "date-fns";
import { Card } from "./ui";
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

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      activeOpacity={0.8}
      className="mb-3"
      style={isCompleted ? { opacity: 0.6 } : undefined}
    >
      <Card padding={false} className="flex-row items-center p-4">
        <TouchableOpacity 
          onPress={() => onToggle(item)} 
          className="mr-4" 
          activeOpacity={0.6}
        >
          <View
            className={`h-7 w-7 items-center justify-center rounded-full ${
              isCompleted 
                ? "bg-primary-100 dark:bg-primary-900/30" 
                : "border border-border-muted dark:border-border-dark bg-surface dark:bg-surface-dark"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 stroke="#59AC77" size={16} strokeWidth={3} />
            ) : (
              <Circle stroke={isDark ? "#36453b" : "#b8c6bd"} size={16} strokeWidth={2.5} />
            )}
          </View>
        </TouchableOpacity>

        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-[17px] font-bold tracking-tight ${
                isCompleted 
                  ? "text-text-muted dark:text-text-dark-muted" 
                  : "text-text-primary dark:text-text-dark-primary"
              }`}
              style={isCompleted ? { textDecorationLine: "line-through" } : undefined}
              numberOfLines={1}
            >
              {item.name}
              {item.quantity ? (
                <Text className="text-[14px] font-medium text-text-muted dark:text-text-dark-muted"> ({item.quantity})</Text>
              ) : null}
            </Text>
            
            {!isCompleted && item.priority === "Urgent" && (
              <View className="rounded-full bg-urgent/10 px-2 py-0.5">
                <Text className="text-[9px] font-black text-urgent uppercase tracking-wider">Urgent</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center mt-1">
            <Text className="text-[12px] font-medium text-text-secondary dark:text-text-dark-secondary">
              {item.category}
            </Text>
            <View className="mx-2 h-1 w-1 rounded-full bg-border dark:bg-border-dark" />
            <Clock stroke={isDark ? "#94a399" : "#95a39a"} size={10} />
            <Text className="ml-1 text-[11px] font-medium text-text-muted dark:text-text-dark-muted">{timeAgo}</Text>
          </View>

          {item.notes?.trim() ? (
            <Text 
              className="mt-2 text-[13px] leading-relaxed text-text-secondary dark:text-text-dark-secondary"
              numberOfLines={2}
            >
              {item.notes}
            </Text>
          ) : null}

          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="mr-2 h-5 w-5 items-center justify-center rounded-full bg-surface-subtle dark:bg-surface-dark-subtle border border-border-muted dark:border-border-dark">
                <Text className="text-[10px] font-black text-text-secondary dark:text-text-dark-primary uppercase">
                  {item.addedBy.name.charAt(0)}
                </Text>
              </View>
              <Text className="text-[11px] text-text-muted dark:text-text-dark-muted">
                by{" "}
                <Text className="font-bold text-text-secondary dark:text-text-dark-secondary">
                  {currentUserId && item.addedBy.uid === currentUserId ? "You" : item.addedBy.name}
                </Text>
              </Text>
            </View>

            {isCompleted && item.completedBy && (
              <View className="flex-row items-center">
                <CheckCircle2 stroke="#59AC77" size={10} strokeWidth={3} className="mr-1" />
                <Text className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
                  {item.completedBy.name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

export default ItemCard;
