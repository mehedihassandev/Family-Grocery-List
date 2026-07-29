import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Swipeable from "react-native-gesture-handler/Swipeable";
import * as Haptics from "expo-haptics";
import { Check, Calendar, Tag, User, FileText, ShoppingCart } from "lucide-react-native";
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
 * Cardless Grocery Item Row with Cross-Platform Swipe-Right-to-Cart Action
 */
const ItemCard = ({ item, onToggle, onPress }: IItemCardProps) => {
  const swipeableRef = useRef<Swipeable>(null);
  const { toRelativeTime } = useDateFormatter();
  const { toInitial } = useTextFormatter();
  const isCompleted = item.status === "completed";
  const isInCart = item.status === "in_cart";
  const timeAgo = toRelativeTime(
    isCompleted
      ? item.completedAt || item.updatedAt || item.createdAt
      : isInCart
        ? item.claimedAt || item.updatedAt || item.createdAt
        : item.createdAt,
  );

  const handleTogglePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle(item);
  };

  const renderLeftActions = () => {
    return (
      <View className="bg-amber-500 justify-center items-start px-6 my-0.5 rounded-xl flex-row items-center">
        <ShoppingCart stroke="#FFF" size={20} strokeWidth={2.5} />
        <Text className="text-white font-extrabold text-[13px] ml-2">
          {isInCart ? "Mark Bought" : "Put in Cart"}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View entering={FadeInDown.duration(250).springify()}>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        friction={2}
        leftThreshold={40}
        onSwipeableWillOpen={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          onToggle(item);
          swipeableRef.current?.close();
        }}
      >
        <View
          className={`flex-row items-center py-4 border-b border-slate-100 bg-white ${
            isCompleted ? "opacity-60" : isInCart ? "bg-amber-50/40 rounded-xl px-2 my-0.5" : ""
          }`}
        >
          {/* Checkbox / Status Button */}
          <TouchableOpacity
            onPress={handleTogglePress}
            activeOpacity={0.7}
            className="pr-3 py-1.5 items-center justify-center"
          >
            {isCompleted ? (
              <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-600">
                <Check stroke="#FFF" size={13} strokeWidth={3} />
              </View>
            ) : isInCart ? (
              <View className="h-6 w-6 items-center justify-center rounded-full bg-amber-500 shadow-sm">
                <ShoppingCart stroke="#FFF" size={12} strokeWidth={2.5} />
              </View>
            ) : (
              <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 bg-white" />
            )}
          </TouchableOpacity>

          {/* Item Details */}
          <TouchableOpacity
            onPress={() => onPress(item)}
            activeOpacity={0.8}
            className="flex-1 py-1"
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-1 pr-2">
                <Text
                  className={`text-[16px] font-extrabold ${
                    isCompleted
                      ? "text-slate-400 line-through"
                      : isInCart
                        ? "text-amber-900"
                        : "text-slate-900"
                  }`}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {item.notes ? (
                  <View className="flex-row items-center mt-0.5">
                    <FileText stroke="#94A3B8" size={12} className="mr-1" />
                    <Text
                      className="text-[12px] font-medium text-slate-400 flex-1"
                      numberOfLines={1}
                    >
                      {item.notes}
                    </Text>
                  </View>
                ) : null}
              </View>

              {isInCart ? (
                <View className="bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full flex-row items-center">
                  <ShoppingCart stroke="#D97706" size={11} className="mr-1" />
                  <Text className="text-[11px] font-extrabold text-amber-800">
                    {item.claimedBy?.name ? `In ${item.claimedBy.name}'s Cart` : "In Cart"}
                  </Text>
                </View>
              ) : !isCompleted ? (
                <PriorityBadge priority={item.priority} />
              ) : null}
            </View>

            <View className="flex-row items-center justify-between mt-1.5">
              <View className="flex-row items-center flex-wrap flex-1 gap-2">
                <View className="flex-row items-center">
                  <Tag stroke="#059669" size={11} className="mr-1" />
                  <Text className="text-[12px] font-bold text-emerald-800">{item.category}</Text>
                </View>

                {item.quantity ? (
                  <Text className="text-[12px] font-bold text-slate-600">• {item.quantity}</Text>
                ) : null}

                {item.dueDate ? (
                  <View className="flex-row items-center ml-1">
                    <Calendar stroke="#D97706" size={11} className="mr-1" />
                    <Text className="text-[12px] font-bold text-amber-800">Due</Text>
                  </View>
                ) : null}

                {item.assignee?.name ? (
                  <View className="flex-row items-center ml-1">
                    <User stroke="#0284C7" size={11} className="mr-1" />
                    <Text className="text-[12px] font-bold text-blue-800">
                      {item.assignee.name}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="flex-row items-center ml-2">
                <Text className="text-[11px] font-medium text-slate-400 mr-2">{timeAgo}</Text>
                <View className="h-6 w-6 rounded-full bg-emerald-600 items-center justify-center overflow-hidden">
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
      </Swipeable>
    </Animated.View>
  );
};

export default ItemCard;
