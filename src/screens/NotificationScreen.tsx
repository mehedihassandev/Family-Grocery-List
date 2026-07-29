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
import { useDateFormatter } from "../hooks";
import { AppHeader } from "../components/ui";
import { INotificationItem } from "../models/notification";

/**
 * Cardless Notifications Screen
 * Why: Pure white canvas, hairline list dividers, zero boxed cards.
 */
const NotificationScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { toRelativeTime } = useDateFormatter();
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
      return { icon: ShoppingBag, color: "#2563EB", bg: "bg-blue-50" };
    }
    if (lowerType.includes("item_completed") || lowerType.includes("complete")) {
      return { icon: Check, color: "#059669", bg: "bg-emerald-50" };
    }
    if (lowerType.includes("urgent")) {
      return { icon: AlertCircle, color: "#EF4444", bg: "bg-rose-50" };
    }
    return { icon: Bell, color: "#475569", bg: "bg-slate-50" };
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* App Header with Back Button */}
      <AppHeader
        title="Notifications"
        eyebrow="Family Activity"
        showBackButton
        onBackPress={() => navigation.goBack()}
        showNotification={false}
      />

      {/* Sub-Header Controls with Breathing Space */}
      <View className="flex-row items-center justify-between px-6 py-3 bg-white border-b border-slate-100">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter("all")}
            className={`rounded-full px-4 py-2 ${filter === "all" ? "bg-slate-900" : "bg-slate-50"}`}
          >
            <Text
              className={`text-[13px] font-extrabold ${filter === "all" ? "text-white" : "text-slate-600"}`}
            >
              All ({feed.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter("unread")}
            className={`rounded-full px-4 py-2 ${filter === "unread" ? "bg-slate-900" : "bg-slate-50"}`}
          >
            <Text
              className={`text-[13px] font-extrabold ${filter === "unread" ? "text-white" : "text-slate-600"}`}
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
          <CheckCheck stroke="#059669" size={16} strokeWidth={2.5} style={{ marginRight: 5 }} />
          <Text className="text-[13px] font-extrabold text-emerald-800">
            {markAllReadMutation.isPending ? "Updating..." : "Mark All Read"}
          </Text>
        </TouchableOpacity>
      </View>

      {errorMessage ? (
        <View className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100">
          <Text className="text-xs font-medium text-rose-700">{errorMessage}</Text>
        </View>
      ) : null}

      {/* Main Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="text-slate-400 text-xs mt-3 font-medium">Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-6 bg-white"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={["#059669"]} />
          }
        >
          {displayList.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-slate-50 mb-3">
                <Inbox stroke="#059669" size={26} strokeWidth={2} />
              </View>
              <Text className="text-base font-extrabold text-slate-900 text-center">
                {filter === "unread" ? "No Unread Notifications" : "All Caught Up!"}
              </Text>
              <Text className="mt-1 text-xs leading-relaxed text-slate-500 text-center px-10">
                {filter === "unread"
                  ? "You have read all your recent family updates."
                  : "Activity from your family members will appear here."}
              </Text>
            </View>
          ) : (
            displayList.map((notif, index) => {
              const isUnread = !notif.isRead;
              const { icon: Icon, color, bg } = getIconData(notif.type);

              return (
                <Animated.View
                  key={notif.id}
                  entering={FadeInDown.duration(250 + index * 30).springify()}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleNotificationPress(notif)}
                    className="py-5 border-b border-slate-100 flex-row items-start"
                  >
                    <View
                      className={`mr-4 h-11 w-11 items-center justify-center rounded-full ${bg} border border-slate-100`}
                    >
                      <Icon stroke={color} size={19} strokeWidth={2.2} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Text
                          className={`text-[16px] tracking-tight ${
                            isUnread ? "font-black text-slate-900" : "font-extrabold text-slate-800"
                          }`}
                        >
                          {notif.title}
                        </Text>
                        <Text className="text-[12px] font-bold text-slate-400">
                          {toRelativeTime(notif.createdAt, "Just now")}
                        </Text>
                      </View>
                      <Text
                        className={`text-[14px] leading-6 mt-1 ${
                          isUnread ? "text-slate-800 font-medium" : "text-slate-500"
                        }`}
                      >
                        {notif.body}
                      </Text>
                    </View>
                    {isUnread && (
                      <View className="ml-3 mt-2 h-2.5 w-2.5 rounded-full bg-emerald-600" />
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
