import React, { useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Swipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import * as Haptics from "expo-haptics";
import { Check, ShoppingCart, User } from "lucide-react-native";
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
 * Redesigned Grocery Item Card matching Light & Dark mode mockups
 */
const ItemCard = ({ item, onToggle, onPress }: IItemCardProps) => {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const { toRelativeTime } = useDateFormatter();
  const { toTrimmed } = useTextFormatter();
  const { isDark, colors } = useAppTheme();
  const isCompleted = item.status === "completed";
  const isInCart = item.status === "in_cart";

  const timeAgo = toRelativeTime(
    isCompleted
      ? item.completedAt || item.updatedAt || item.createdAt
      : isInCart
        ? item.claimedAt || item.updatedAt || item.createdAt
        : item.createdAt,
  );

  const addedByName = useMemo(() => {
    const raw = toTrimmed(item.addedBy?.name);
    return raw ? raw.split(/\s+/)[0] : "Mehedi";
  }, [toTrimmed, item.addedBy?.name]);

  const handleTogglePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle(item);
  };

  const renderLeftActions = () => {
    return (
      <View
        className="justify-center items-start px-5 mb-2.5 rounded-2xl flex-row items-center"
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
        onSwipeableOpen={(direction: "left" | "right") => {
          if (direction === "left") {
            handleTogglePress();
            swipeableRef.current?.close();
          }
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onPress && onPress(item)}
          style={{ opacity: isCompleted ? 0.6 : 1 }}
        >
          <View
            className="flex-row items-start p-3.5 rounded-2xl border shadow-xs"
            style={{
              backgroundColor: isInCart
                ? isDark
                  ? "#1E2A3A"
                  : "#FEF3C7"
                : isDark
                  ? "#16233B"
                  : "#FFFFFF",
              borderColor: isInCart ? colors.warning : isDark ? "#253347" : "#F1F5F9",
            }}
          >
            {/* Square Checkbox Box */}
            <TouchableOpacity
              onPress={handleTogglePress}
              activeOpacity={0.8}
              className="mr-3 mt-0.5 h-7 w-7 items-center justify-center rounded-xl border"
              style={{
                backgroundColor: isCompleted
                  ? isDark
                    ? "#10B981"
                    : "#006837"
                  : isInCart
                    ? colors.warning
                    : isDark
                      ? "#0F182A"
                      : "#EBF2FF",
                borderColor: isCompleted
                  ? isDark
                    ? "#10B981"
                    : "#006837"
                  : isInCart
                    ? colors.warning
                    : isDark
                      ? "#253347"
                      : "#DCE7FE",
              }}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              {isCompleted ? (
                <Check stroke="#FFFFFF" size={16} strokeWidth={3} />
              ) : isInCart ? (
                <ShoppingCart stroke="#FFFFFF" size={14} strokeWidth={2.5} />
              ) : null}
            </TouchableOpacity>

            {/* Item Details */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-[15px] font-extrabold tracking-tight ${
                    isCompleted ? "line-through" : ""
                  }`}
                  style={{
                    color: isCompleted ? colors.textMuted : isDark ? "#F8FAFC" : "#0F172A",
                  }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>

                {isInCart ? (
                  <View
                    className="px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: isDark ? "#3A2E16" : colors.warningLight,
                      borderColor: colors.warning,
                    }}
                  >
                    <Text
                      className="text-[9px] font-black uppercase tracking-wider"
                      style={{ color: colors.warning }}
                    >
                      In Cart
                    </Text>
                  </View>
                ) : !isCompleted && item.priority ? (
                  <PriorityBadge priority={item.priority} />
                ) : null}
              </View>

              {/* Quantity */}
              {item.quantity ? (
                <Text
                  className="text-[12px] font-medium mt-0.5 mb-1.5"
                  style={{ color: isDark ? "#94A3B8" : "#64748B" }}
                >
                  {item.quantity}
                </Text>
              ) : null}

              {/* Added By & Time Metadata Row */}
              <View className="flex-row items-center mt-0.5">
                <View
                  className="h-4 w-4 rounded-full items-center justify-center mr-1.5"
                  style={{ backgroundColor: isDark ? "#064E3B" : "#006837" }}
                >
                  {item.addedBy?.photoURL ? (
                    <Image
                      source={{ uri: item.addedBy.photoURL }}
                      className="h-full w-full rounded-full"
                    />
                  ) : (
                    <User stroke="#FFFFFF" size={9} strokeWidth={2.5} />
                  )}
                </View>

                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: isDark ? "#34D399" : "#475569" }}
                >
                  Added by {addedByName} • {timeAgo}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
};

export default ItemCard;
