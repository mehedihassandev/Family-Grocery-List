import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Swipeable from "react-native-gesture-handler/Swipeable";
import * as Haptics from "expo-haptics";
import { Check, Calendar, Tag, User, ShoppingCart } from "lucide-react-native";
import { IGroceryItem } from "../types";
import { useDateFormatter, useTextFormatter, useAppTheme } from "../hooks";
import { PriorityBadge } from "./ui";

interface IItemCardProps {
  item: IGroceryItem;
  onToggle: (item: IGroceryItem) => void;
  onPress: (item: IGroceryItem) => void;
  currentUserId?: string;
}

/**
 * Modern Sleek Grocery Item Card with Swipe Actions & Theme Support
 */
const ItemCard = ({ item, onToggle, onPress }: IItemCardProps) => {
  const swipeableRef = useRef<Swipeable>(null);
  const { toRelativeTime } = useDateFormatter();
  const { toInitial } = useTextFormatter();
  const { colors } = useAppTheme();
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
      <View
        className="justify-center items-start px-5 mb-2.5 rounded-xl flex-row items-center"
        style={{ backgroundColor: colors.warning }}
      >
        <ShoppingCart stroke={colors.white} size={18} strokeWidth={2.5} />
        <Text className="text-white font-extrabold text-xs ml-2">
          {isInCart ? "Move to List" : "Add to Cart"}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View entering={FadeInDown.duration(200).springify()} className="mb-2.5">
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        onSwipeableOpen={(direction) => {
          if (direction === "left") {
            handleTogglePress();
            swipeableRef.current?.close();
          }
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onPress && onPress(item)}
          style={{ opacity: isCompleted ? 0.55 : 1 }}
        >
          <View
            className="flex-row items-center p-3.5 rounded-xl border"
            style={{
              backgroundColor: isInCart ? colors.bgCartActive : colors.bgCard,
              borderColor: isInCart ? colors.warning : colors.border,
            }}
          >
            {/* Circular Checkbox */}
            <TouchableOpacity
              onPress={handleTogglePress}
              activeOpacity={0.8}
              className="mr-3.5 h-6 w-6 items-center justify-center rounded-full"
              hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
            >
              <View
                className="h-5 w-5 rounded-full items-center justify-center border"
                style={{
                  backgroundColor: isCompleted
                    ? colors.accent
                    : isInCart
                      ? colors.warning
                      : "transparent",
                  borderColor: isCompleted
                    ? colors.accent
                    : isInCart
                      ? colors.warning
                      : colors.iconMuted,
                }}
              >
                {isCompleted ? (
                  <Check stroke={colors.white} size={12} strokeWidth={3} />
                ) : isInCart ? (
                  <ShoppingCart stroke={colors.white} size={11} strokeWidth={2.5} />
                ) : null}
              </View>
            </TouchableOpacity>

            {/* Item Details */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-[15px] font-bold tracking-tight ${
                    isCompleted ? "line-through" : ""
                  }`}
                  style={{ color: isCompleted ? colors.textMuted : colors.textPrimary }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                {isInCart ? (
                  <View
                    className="px-2 py-0.5 rounded-full border"
                    style={{ backgroundColor: colors.warningLight, borderColor: colors.warning }}
                  >
                    <Text
                      className="text-[9px] font-black uppercase tracking-wider"
                      style={{ color: colors.warning }}
                    >
                      {item.claimedBy?.name ? `In ${item.claimedBy.name}'s Cart` : "In Cart"}
                    </Text>
                  </View>
                ) : !isCompleted && item.priority ? (
                  <PriorityBadge priority={item.priority} />
                ) : null}
              </View>

              {/* Sub-row Details */}
              <View className="flex-row items-center justify-between mt-1.5">
                <View className="flex-row items-center flex-wrap flex-1 gap-2">
                  <View className="flex-row items-center">
                    <Tag stroke={colors.accent} size={11} className="mr-1" />
                    <Text className="text-[11px] font-bold" style={{ color: colors.accent }}>
                      {item.category}
                    </Text>
                  </View>

                  {item.storeName ? (
                    <View
                      className="flex-row items-center px-1.5 py-0.5 rounded-md border"
                      style={{ backgroundColor: colors.bgInput, borderColor: colors.border }}
                    >
                      <Text
                        className="text-[10px] font-bold"
                        style={{ color: colors.textSecondary }}
                      >
                        🏬 {item.storeName}
                      </Text>
                    </View>
                  ) : null}

                  {item.actualPrice || item.estimatedTotal || item.unitPrice ? (
                    <View
                      className="border px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: colors.accentLightSubtle,
                        borderColor: colors.border,
                      }}
                    >
                      <Text className="text-[10px] font-extrabold" style={{ color: colors.accent }}>
                        ৳
                        {(item.actualPrice || item.estimatedTotal || item.unitPrice || 0).toFixed(
                          0,
                        )}
                      </Text>
                    </View>
                  ) : null}

                  {item.quantity ? (
                    <Text className="text-[11px] font-bold" style={{ color: colors.textSecondary }}>
                      • {item.quantity}
                    </Text>
                  ) : null}

                  {item.dueDate ? (
                    <View className="flex-row items-center ml-1">
                      <Calendar stroke={colors.warning} size={11} className="mr-1" />
                      <Text className="text-[11px] font-bold" style={{ color: colors.warning }}>
                        Due
                      </Text>
                    </View>
                  ) : null}

                  {item.assignee?.name ? (
                    <View className="flex-row items-center ml-1">
                      <User stroke={colors.info} size={11} className="mr-1" />
                      <Text className="text-[11px] font-bold" style={{ color: colors.info }}>
                        {item.assignee.name}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View className="flex-row items-center ml-2">
                  <Text
                    className="text-[10px] font-medium mr-1.5"
                    style={{ color: colors.textMuted }}
                  >
                    {timeAgo}
                  </Text>
                  <View className="h-5 w-5 rounded-full bg-emerald-600 items-center justify-center overflow-hidden">
                    {item.addedBy?.photoURL ? (
                      <Image source={{ uri: item.addedBy.photoURL }} className="h-full w-full" />
                    ) : (
                      <Text className="text-white text-[8px] font-bold">
                        {toInitial(item.addedBy?.name || "U")}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
};

export default ItemCard;
