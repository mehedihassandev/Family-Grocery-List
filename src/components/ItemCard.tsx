import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Check, Calendar, Tag, User, FileText } from "lucide-react-native";
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
 * Why: To display item details in the main list with clean, non-nested touch target controls.
 * @param props - Component props including item data and interaction handlers
 */
const ItemCard = ({ item, onToggle, onPress }: IItemCardProps) => {
  const { toRelativeTime } = useDateFormatter();
  const { toInitial } = useTextFormatter();
  const isCompleted = item.status === "completed";
  const timeAgo = toRelativeTime(item.createdAt);

  return (
    <View className="mb-3">
      <View
        className={`flex-row overflow-hidden rounded-2xl bg-white border ${
          isCompleted
            ? "border-slate-200/60 bg-slate-50/60 opacity-75"
            : "border-slate-200/90 shadow-xs"
        }`}
      >
        {/* Priority stripe accent */}
        <View
          style={{
            width: 4.5,
            backgroundColor: isCompleted
              ? "#CBD5E1"
              : item.priority === "Urgent"
                ? "#EF4444"
                : item.priority === "Medium"
                  ? "#F59E0B"
                  : "#10B981",
          }}
        />

        {/* Independent Checkbox Toggle Area */}
        <TouchableOpacity
          onPress={() => onToggle(item)}
          activeOpacity={0.7}
          className="pl-3.5 pr-2 py-3.5 items-center justify-center"
        >
          {isCompleted ? (
            <View className="h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 shadow-xs">
              <Check stroke="#FFF" size={16} strokeWidth={3} />
            </View>
          ) : (
            <View className="h-7 w-7 items-center justify-center rounded-xl border-2 border-slate-300 bg-slate-50" />
          )}
        </TouchableOpacity>

        {/* Independent Card Body Details Touch Area */}
        <TouchableOpacity
          onPress={() => onPress(item)}
          activeOpacity={0.82}
          className="flex-1 py-3.5 pr-3.5 justify-between"
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 pr-2">
              <Text
                className={`text-[15px] font-bold ${
                  isCompleted ? "text-slate-400 line-through opacity-70" : "text-slate-900"
                }`}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.notes ? (
                <View className="flex-row items-center mt-0.5">
                  <FileText stroke="#94A3B8" size={11} className="mr-1" />
                  <Text className="text-[11px] font-medium text-slate-400 flex-1" numberOfLines={1}>
                    {item.notes}
                  </Text>
                </View>
              ) : null}
            </View>

            {!isCompleted && <PriorityBadge priority={item.priority} />}
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center flex-wrap flex-1 gap-1.5">
              <View className="bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 flex-row items-center">
                <Tag stroke="#059669" size={10} className="mr-1" />
                <Text className="text-[11px] font-bold text-emerald-800">{item.category}</Text>
              </View>

              {item.quantity ? (
                <View className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80">
                  <Text className="text-[11px] font-bold text-slate-700">{item.quantity}</Text>
                </View>
              ) : null}

              {item.dueDate ? (
                <View className="bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 flex-row items-center">
                  <Calendar stroke="#D97706" size={10} className="mr-1" />
                  <Text className="text-[11px] font-bold text-amber-800">Due</Text>
                </View>
              ) : null}

              {item.assignee?.name ? (
                <View className="bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20 flex-row items-center">
                  <User stroke="#0284C7" size={10} className="mr-1" />
                  <Text className="text-[11px] font-bold text-sky-800">{item.assignee.name}</Text>
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center ml-2">
              <Text className="text-[10px] font-medium text-slate-400 mr-2">{timeAgo}</Text>
              <View className="h-6 w-6 rounded-full bg-emerald-600 border-2 border-white items-center justify-center overflow-hidden shadow-xs">
                {item.addedBy?.photoURL ? (
                  <Image source={{ uri: item.addedBy.photoURL }} className="h-full w-full" />
                ) : (
                  <Text className="text-white text-[9px] font-bold">
                    {toInitial(item.addedBy?.name || "U")}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ItemCard;
