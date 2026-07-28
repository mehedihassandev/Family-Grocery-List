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
import { Bell, Check, ShoppingBag, AlertCircle, Inbox, CheckCheck } from "lucide-react-native";

import { ROUTES } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../hooks/queries/useNotificationQueries";
import { useDateFormatter } from "../hooks";
import { AppHeader, Card } from "../components/ui";
import { INotificationItem } from "../models/notification";

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

  // Exclude actions performed by current user
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
      return { icon: ShoppingBag, color: "#3B82F6", bg: "bg-blue-50 border-blue-100" };
    }
    if (lowerType.includes("item_completed") || lowerType.includes("complete")) {
      return { icon: Check, color: "#10B981", bg: "bg-emerald-50 border-emerald-100" };
    }
    if (lowerType.includes("urgent")) {
      return { icon: AlertCircle, color: "#EF4444", bg: "bg-red-50 border-red-100" };
    }
    return { icon: Bell, color: "#64748B", bg: "bg-slate-50 border-slate-100" };
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-slate-50">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* App Header with Back Button */}
      <AppHeader
        title="Notifications"
        eyebrow="Family Activity"
        showBackButton
        onBackPress={() => navigation.goBack()}
        showNotification={false}
      />

      {/* Sub-Header Controls */}
      <View className="flex-row items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-xs">
        {/* Tabs */}
        <View className="flex-row items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter("all")}
            className={`rounded-lg px-4 py-1.5 ${filter === "all" ? "bg-white" : ""}`}
          >
            <Text
              className={`text-xs font-bold ${filter === "all" ? "text-emerald-700" : "text-slate-500"}`}
            >
              All ({feed.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilter("unread")}
            className={`rounded-lg px-4 py-1.5 ${filter === "unread" ? "bg-white" : ""}`}
          >
            <View className="flex-row items-center">
              <Text
                className={`text-xs font-bold ${filter === "unread" ? "text-emerald-700" : "text-slate-500"}`}
              >
                Unread
              </Text>
              {unreadItems.length > 0 && (
                <View className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-600">
                  <Text className="text-[10px] font-bold text-white">{unreadItems.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Mark All Read Action */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleMarkAllRead}
          disabled={unreadItems.length === 0 || markAllReadMutation.isPending}
          className={`flex-row items-center px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 ${
            unreadItems.length === 0 ? "opacity-40" : ""
          }`}
        >
          <CheckCheck stroke="#059669" size={14} strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text className="text-xs font-bold text-emerald-700">
            {markAllReadMutation.isPending ? "Updating..." : "Mark All Read"}
          </Text>
        </TouchableOpacity>
      </View>

      {errorMessage ? (
        <View className="mx-6 mt-3 p-3 rounded-xl bg-red-50 border border-red-200">
          <Text className="text-xs font-medium text-red-700">{errorMessage}</Text>
        </View>
      ) : null}

      {/* Main Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-slate-400 text-xs mt-3 font-medium">Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 px-6 pt-4"
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={["#10B981"]} />
          }
        >
          {displayList.length === 0 ? (
            <View className="py-24 items-center justify-center">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 mb-4">
                <Inbox stroke="#10B981" size={32} strokeWidth={2} />
              </View>
              <Text className="text-lg font-black text-slate-800 text-center">
                {filter === "unread" ? "No Unread Notifications" : "All Caught Up!"}
              </Text>
              <Text className="mt-1 text-xs leading-relaxed text-slate-500 text-center px-10">
                {filter === "unread"
                  ? "You have read all your recent family updates."
                  : "Activity from your family members will appear here."}
              </Text>
            </View>
          ) : (
            displayList.map((notif) => {
              const isUnread = !notif.isRead;
              const { icon: Icon, color, bg } = getIconData(notif.type);

              return (
                <TouchableOpacity
                  key={notif.id}
                  activeOpacity={0.8}
                  onPress={() => handleNotificationPress(notif)}
                  className="mb-3"
                >
                  <Card
                    className={`p-4 rounded-2xl border ${
                      isUnread
                        ? "bg-white border-emerald-300 shadow-sm"
                        : "bg-slate-50/70 border-slate-200 shadow-none"
                    }`}
                  >
                    <View className="flex-row items-start">
                      <View
                        className={`mr-3.5 h-11 w-11 items-center justify-center rounded-2xl border ${bg}`}
                      >
                        <Icon stroke={color} size={20} strokeWidth={2.5} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-0.5">
                          <Text
                            className={`text-sm tracking-tight ${
                              isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-600"
                            }`}
                          >
                            {notif.title}
                          </Text>
                          <Text className="text-[10px] font-medium text-slate-400">
                            {toRelativeTime(notif.createdAt, "Just now")}
                          </Text>
                        </View>
                        <Text
                          className={`text-xs leading-relaxed ${
                            isUnread ? "text-slate-700 font-medium" : "text-slate-500"
                          }`}
                        >
                          {notif.body}
                        </Text>
                      </View>
                      {isUnread && (
                        <View className="ml-2 mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-600" />
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;
