import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Bell, Check, ShoppingBag, AlertCircle, Inbox, CheckCheck } from "lucide-react-native";

import { ROUTES } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../hooks/queries/useNotificationQueries";
import { useDateFormatter, useAppTheme } from "../hooks";
import { AppHeader } from "../components/ui";
import { INotificationItem } from "../models/notification";

/**
 * Cardless Notifications Screen
 * Why: Pure white/dark canvas, hairline list dividers, zero boxed cards.
 */
const NotificationScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { toRelativeTime } = useDateFormatter();
  const { isDark, colors } = useAppTheme();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const familyId = user?.familyId || "";
  const myUid = user?.uid || "";

  const { data: notifData, isLoading, refetch, isRefetching } = useNotificationsQuery(familyId);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const rawItems: INotificationItem[] = notifData?.items || [];

  const feed = rawItems.filter((n) => n.actorUid !== myUid);
  const displayList = filter === "unread" ? feed.filter((n) => !n.isRead) : feed;
  const unreadItems = feed.filter((n) => !n.isRead);

  const handleMarkAllRead = async () => {
    if (!familyId || unreadItems.length === 0) return;
    try {
      setErrorMessage(null);
      await markAllReadMutation.mutateAsync(familyId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not mark notifications read.",
      );
    }
  };

  const handleNotificationPress = async (notif: INotificationItem) => {
    if (!notif.isRead && familyId) {
      try {
        await markReadMutation.mutateAsync({ familyId, notificationId: notif.id });
      } catch (err) {
        if (__DEV__) console.warn("Failed to mark notification read:", err);
      }
    }

    const itemId = notif.data?.itemId;
    if (itemId) {
      navigation.navigate(ROUTES.ITEM_DETAIL, { itemId });
    }
  };

  const getIconData = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("item_added") || lowerType.includes("add")) {
      return { icon: ShoppingBag, color: colors.info, bgColor: colors.infoLight };
    }
    if (lowerType.includes("item_completed") || lowerType.includes("complete")) {
      return { icon: Check, color: colors.accent, bgColor: colors.accentLightSubtle };
    }
    if (lowerType.includes("urgent")) {
      return { icon: AlertCircle, color: colors.danger, bgColor: colors.dangerLight };
    }
    return { icon: Bell, color: colors.icon, bgColor: colors.bgInput };
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: colors.bgCanvas }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* App Header with Back Button */}
      <AppHeader
        title="Notifications"
        eyebrow="Family Activity"
        showBackButton
        onBackPress={() => navigation.goBack()}
        showNotification={false}
      />

      {/* Sub-Header Controls with Breathing Space */}
      <View
        className="flex-row items-center justify-between px-6 py-3"
        style={{ backgroundColor: colors.bgCanvas }}
      >
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter("all")}
            className="rounded-full px-4 py-2"
            style={
              filter === "all"
                ? { backgroundColor: colors.accent }
                : { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border }
            }
          >
            <Text
              className="text-[13px] font-extrabold"
              style={{ color: filter === "all" ? colors.white : colors.textSecondary }}
            >
              All ({feed.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter("unread")}
            className="rounded-full px-4 py-2"
            style={
              filter === "unread"
                ? { backgroundColor: colors.accent }
                : { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border }
            }
          >
            <Text
              className="text-[13px] font-extrabold"
              style={{ color: filter === "unread" ? colors.white : colors.textSecondary }}
            >
              Unread ({unreadItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleMarkAllRead}
          disabled={unreadItems.length === 0 || markAllReadMutation.isPending}
          className={`flex-row items-center ${unreadItems.length === 0 ? "opacity-40" : ""}`}
        >
          <CheckCheck
            stroke={colors.accent}
            size={16}
            strokeWidth={2.5}
            style={{ marginRight: 5 }}
          />
          <Text className="text-[13px] font-extrabold" style={{ color: colors.accent }}>
            {markAllReadMutation.isPending ? "Updating..." : "Mark All Read"}
          </Text>
        </TouchableOpacity>
      </View>

      {errorMessage ? (
        <View
          className="mx-6 mt-3 p-3 rounded-xl border"
          style={{ backgroundColor: colors.dangerLight, borderColor: colors.border }}
        >
          <Text className="text-xs font-medium" style={{ color: colors.danger }}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Main Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.accent} />
          <Text className="text-xs mt-3 font-medium" style={{ color: colors.textMuted }}>
            Loading notifications...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-6"
          style={{ backgroundColor: colors.bgCanvas }}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.accent]}
            />
          }
        >
          {displayList.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <View
                className="h-14 w-14 items-center justify-center rounded-full mb-3"
                style={{ backgroundColor: colors.bgInput }}
              >
                <Inbox stroke={colors.accent} size={26} strokeWidth={2} />
              </View>
              <Text
                className="text-base font-extrabold text-center"
                style={{ color: colors.textPrimary }}
              >
                {filter === "unread" ? "No Unread Notifications" : "All Caught Up!"}
              </Text>
              <Text
                className="mt-1 text-xs leading-relaxed text-center px-10"
                style={{ color: colors.textSecondary }}
              >
                {filter === "unread"
                  ? "You have read all your recent family updates."
                  : "Activity from your family members will appear here."}
              </Text>
            </View>
          ) : (
            displayList.map((notif, index) => {
              const isUnread = !notif.isRead;
              const { icon: Icon, color, bgColor } = getIconData(notif.type);

              return (
                <Animated.View
                  key={notif.id}
                  entering={FadeInDown.duration(250 + index * 30).springify()}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleNotificationPress(notif)}
                    className="py-5 flex-row items-start"
                  >
                    <View
                      className="mr-4 h-11 w-11 items-center justify-center rounded-full border"
                      style={{ backgroundColor: bgColor, borderColor: colors.border }}
                    >
                      <Icon stroke={color} size={19} strokeWidth={2.2} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text
                          className={`text-[16px] tracking-tight ${
                            isUnread ? "font-black" : "font-extrabold"
                          }`}
                          style={{ color: colors.textPrimary }}
                        >
                          {notif.title}
                        </Text>
                        <Text className="text-[12px] font-bold" style={{ color: colors.textMuted }}>
                          {toRelativeTime(notif.createdAt, "Just now")}
                        </Text>
                      </View>
                      <Text
                        className={`text-[14px] leading-6 mt-1 ${isUnread ? "font-medium" : ""}`}
                        style={{ color: isUnread ? colors.textPrimary : colors.textSecondary }}
                      >
                        {notif.body}
                      </Text>
                    </View>
                    {isUnread && (
                      <View
                        className="ml-3 mt-2 h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: colors.accent }}
                      />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
