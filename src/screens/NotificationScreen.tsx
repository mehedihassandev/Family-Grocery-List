import React, { useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { isToday, isYesterday } from "date-fns";
import { Check, AlertTriangle, Sparkles, UserPlus, Inbox } from "lucide-react-native";

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
 * Modern Notifications & Activity Feed Screen
 * Powered exclusively by live API / Firestore data.
 */
const NotificationScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { toDate, toRelativeTime } = useDateFormatter();
  const { isDark, colors } = useAppTheme();

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const familyId = user?.familyId || "";
  const myUid = user?.uid || "";

  // Real backend query hook
  const { data: notifData, isLoading, refetch, isRefetching } = useNotificationsQuery(familyId);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const rawItems: INotificationItem[] = notifData?.items || [];
  // Exclude notifications created by current user if desired, or show all family activity
  const feed = rawItems.filter((n) => n.actorUid !== myUid);

  const displayList = filter === "unread" ? feed.filter((n) => !n.isRead) : feed;
  const unreadItems = feed.filter((n) => !n.isRead);
  const unreadCount = unreadItems.length;

  const handleMarkAllRead = async () => {
    if (!familyId || unreadCount === 0) return;
    try {
      setErrorMessage(null);
      await markAllReadMutation.mutateAsync(familyId);
      showToast("All notifications marked as read");
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

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => {
      setActionToast(null);
    }, 2800);
  };

  const getSectionForDate = (
    dateVal: Parameters<typeof toDate>[0],
  ): "TODAY" | "YESTERDAY" | "EARLIER" => {
    const d = toDate(dateVal);
    if (!d) return "TODAY";
    if (isToday(d)) return "TODAY";
    if (isYesterday(d)) return "YESTERDAY";
    return "EARLIER";
  };

  const getCategoryType = (type: string, title: string = "") => {
    const lower = (type + " " + title).toLowerCase();
    if (lower.includes("budget") || lower.includes("urgent")) return "budget_alert";
    if (lower.includes("added") || lower.includes("item_added") || lower.includes("add"))
      return "list_update";
    if (lower.includes("completed") || lower.includes("item_completed") || lower.includes("bought"))
      return "purchase_complete";
    if (lower.includes("family") || lower.includes("member") || lower.includes("join"))
      return "family_update";
    if (lower.includes("suggestion") || lower.includes("smart")) return "smart_suggestion";
    return "generic";
  };

  // Group real API notifications by Date section
  const sectionOrder: ("TODAY" | "YESTERDAY" | "EARLIER")[] = ["TODAY", "YESTERDAY", "EARLIER"];

  const renderCardContent = (notif: INotificationItem) => {
    const isUnread = !notif.isRead;
    const categoryType = getCategoryType(notif.type, notif.title);

    // Left border indicator stripe
    let leftStripeColor = "transparent";
    if (categoryType === "budget_alert") {
      leftStripeColor = "#EF4444";
    } else if (categoryType === "list_update" || isUnread) {
      leftStripeColor = isDark ? "#34D399" : "#006837";
    }

    // Render Left Icon / Avatar
    const renderLeftVisual = () => {
      if (categoryType === "budget_alert") {
        return (
          <View className="h-11 w-11 rounded-full items-center justify-center bg-red-100 dark:bg-red-950/60">
            <AlertTriangle stroke="#EF4444" size={20} strokeWidth={2.2} />
          </View>
        );
      }

      if (categoryType === "smart_suggestion") {
        return (
          <View className="h-11 w-11 rounded-full items-center justify-center bg-blue-100 dark:bg-blue-950/60">
            <Sparkles stroke="#0284C7" size={20} strokeWidth={2.2} />
          </View>
        );
      }

      if (categoryType === "family_update") {
        return (
          <View className="h-11 w-11 rounded-full items-center justify-center bg-emerald-100 dark:bg-emerald-950/60">
            <UserPlus stroke={isDark ? "#34D399" : "#006837"} size={20} strokeWidth={2.2} />
          </View>
        );
      }

      // User avatar for user-driven notifications
      return (
        <View className="relative">
          <View
            className="h-11 w-11 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.accent }}
          >
            <Text className="text-white font-black text-sm">
              {notif.actorName ? notif.actorName.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
          {/* Active status indicator dot */}
          <View
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 bg-emerald-400"
            style={{ borderColor: isDark ? "#161F2E" : "#FFFFFF" }}
          />
        </View>
      );
    };

    return (
      <View
        className="relative overflow-hidden rounded-2xl p-4 mb-3.5 border shadow-xs flex-row items-start"
        style={{
          backgroundColor: isDark ? "#161F2E" : "#FFFFFF",
          borderColor: isDark ? "#253347" : "#F1F5F9",
        }}
      >
        {/* Vertical Left Accent Stripe */}
        {leftStripeColor !== "transparent" && (
          <View
            className="absolute left-0 top-0 bottom-0 w-[4px]"
            style={{ backgroundColor: leftStripeColor }}
          />
        )}

        {/* Icon / Avatar Bubble */}
        <View className="mr-3.5 pl-1">{renderLeftVisual()}</View>

        {/* Content Column */}
        <View className="flex-1">
          {/* Header Row: Title + Time */}
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="text-[15px] font-black tracking-tight"
              style={{ color: colors.textPrimary }}
            >
              {notif.title}
            </Text>
            <Text
              className="text-[12px] font-bold"
              style={{ color: isDark ? "#64748B" : "#94A3B8" }}
            >
              {toRelativeTime(notif.createdAt, "Just now")}
            </Text>
          </View>

          {/* Notification Body */}
          <Text
            className={`text-[14px] leading-[21px] ${isUnread ? "font-semibold" : "font-normal"}`}
            style={{ color: isUnread ? colors.textPrimary : colors.textSecondary }}
          >
            {notif.body}
          </Text>
        </View>

        {/* Unread Badge Indicator */}
        {isUnread && (
          <View
            className="ml-2 mt-1 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors.accent }}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: colors.bgCanvas }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Top App Header with "Notifications" title */}
      <AppHeader
        title="Notifications"
        showBackButton
        onBackPress={() =>
          navigation.canGoBack() ? navigation.goBack() : navigation.navigate(ROUTES.ROOT)
        }
        showNotification={false}
        showProfileAvatar={true}
        onProfilePress={() => navigation.navigate(ROUTES.PROFILE)}
      />

      {/* Screen Title & Mark All Read Action Bar */}
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter("all")}
            className="rounded-full px-4 py-1.5"
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
            className="rounded-full px-4 py-1.5"
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
              Unread ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleMarkAllRead}
          disabled={unreadCount === 0 || markAllReadMutation.isPending}
          className={`flex-row items-center px-3.5 py-1.5 rounded-full border ${
            unreadCount === 0 ? "opacity-40" : ""
          }`}
          style={{
            backgroundColor: isDark ? "#0B3527" : "#E6F4EA",
            borderColor: isDark ? "rgba(52, 211, 153, 0.25)" : "rgba(0, 104, 55, 0.15)",
          }}
        >
          <Check
            stroke={isDark ? "#34D399" : "#0F5132"}
            size={15}
            strokeWidth={2.5}
            style={{ marginRight: 4 }}
          />
          <Text
            className="text-[13px] font-black"
            style={{ color: isDark ? "#34D399" : "#0F5132" }}
          >
            {markAllReadMutation.isPending ? "Updating..." : "Mark all read"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Toast Feedback */}
      {actionToast && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          className="mx-5 my-2 p-3 rounded-xl bg-emerald-700 items-center justify-center flex-row shadow-md"
        >
          <Check stroke="#FFFFFF" size={16} strokeWidth={2.5} className="mr-2" />
          <Text className="text-white text-xs font-bold">{actionToast}</Text>
        </Animated.View>
      )}

      {errorMessage && (
        <View
          className="mx-5 mt-2 p-3 rounded-xl border"
          style={{ backgroundColor: colors.dangerLight, borderColor: colors.border }}
        >
          <Text className="text-xs font-medium" style={{ color: colors.danger }}>
            {errorMessage}
          </Text>
        </View>
      )}

      {/* Main API Notifications Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center" />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-5 mt-1"
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
                  ? "You have read all recent family updates."
                  : "Activity from your family members will appear here."}
              </Text>
            </View>
          ) : (
            sectionOrder.map((secName) => {
              const sectionItems = displayList.filter(
                (item) => getSectionForDate(item.createdAt) === secName,
              );
              if (sectionItems.length === 0) return null;

              return (
                <View key={secName} className="mb-2">
                  <Text
                    className="text-[12px] font-black uppercase tracking-widest mb-3 mt-4"
                    style={{ color: isDark ? "#64748B" : "#94A3B8" }}
                  >
                    {secName}
                  </Text>

                  {sectionItems.map((notif, index) => (
                    <Animated.View
                      key={notif.id}
                      entering={FadeInDown.duration(240 + index * 30).springify()}
                    >
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleNotificationPress(notif)}
                      >
                        {renderCardContent(notif)}
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
