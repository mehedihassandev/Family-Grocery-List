import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "nativewind";
import { Bell, Check, ShoppingBag, X, AlertCircle, Inbox } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { markNotificationsAsRead } from "../services/notification";
import { formatDistanceToNow } from "date-fns";
import { Card } from "./ui";

type NotificationModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Modal to display recent family activities and notifications
 * Why: To keep users updated on grocery list changes (items added, completed) in a centralized place.
 */
const NotificationModal = ({ visible, onClose }: NotificationModalProps) => {
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const notifications = useNotificationStore((state) => state.notifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const isDark = colorScheme === "dark";
  const myUid = user?.uid || "";

  // Filter out actions done by the current user
  const feed = notifications.filter((n) => n.actorId !== myUid);
  const displayList = filter === "unread" ? feed.filter((n) => !n.readBy.includes(myUid)) : feed;
  const unreadIds = feed.filter((n) => !n.readBy.includes(myUid)).map((n) => n.id);

  const handleMarkAllRead = async () => {
    if (unreadIds.length > 0) {
      await markNotificationsAsRead(unreadIds, myUid);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "Just now";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Just now";
    }
  };

  const getIconData = (type: string) => {
    switch (type) {
      case "item_added":
        return {
          icon: ShoppingBag,
          color: "#3b82f6",
          bg: isDark ? "bg-blue-900/20" : "bg-blue-50",
        };
      case "item_completed":
        return {
          icon: Check,
          color: "#59AC77",
          bg: isDark ? "bg-primary-900/20" : "bg-primary-50",
        };
      case "urgent_item":
        return {
          icon: AlertCircle,
          color: "#ef4444",
          bg: isDark ? "bg-red-900/20" : "bg-red-50",
        };
      default:
        return {
          icon: Bell,
          color: isDark ? "#cbd5cf" : "#748379",
          bg: isDark ? "bg-surface-dark-muted" : "bg-surface-muted",
        };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute bottom-0 left-0 right-0 top-0"
        />

        <View
          className="max-h-[90%] min-h-[50%] rounded-t-4xl bg-background dark:bg-background-dark px-6 pb-12 pt-3"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          {/* Handle bar */}
          <View className="mb-4 items-center">
            <View className="h-1.5 w-14 rounded-full bg-border-muted dark:bg-border-dark" />
          </View>

          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-[2px] text-primary-600 dark:text-primary-400">
                Activity Feed
              </Text>
              <Text className="text-[32px] font-black tracking-tight text-text-primary dark:text-text-dark-primary">
                Notifications
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-muted dark:bg-surface-dark-muted border border-border-muted dark:border-border-dark"
            >
              <X stroke={isDark ? "#cbd5cf" : "#748379"} size={20} strokeWidth={3} />
            </TouchableOpacity>
          </View>

          <View className="mb-6 flex-row items-center justify-between border-b border-border-muted/40 dark:border-border-dark/40 pb-4">
            <View className="flex-row items-center bg-surface-muted dark:bg-surface-dark-muted rounded-xl p-1 border border-border-muted dark:border-border-dark">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setFilter("all")}
                className={`rounded-lg px-4 py-1.5 ${filter === "all" ? "bg-surface dark:bg-surface-dark shadow-sm" : ""}`}
              >
                <Text
                  className={`text-[12px] font-black uppercase tracking-wider ${filter === "all" ? "text-primary-600 dark:text-primary-400" : "text-text-muted dark:text-text-dark-muted"}`}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setFilter("unread")}
                className={`rounded-lg px-4 py-1.5 ${filter === "unread" ? "bg-surface dark:bg-surface-dark shadow-sm" : ""}`}
              >
                <View className="flex-row items-center">
                  <Text
                    className={`text-[12px] font-black uppercase tracking-wider ${filter === "unread" ? "text-primary-600 dark:text-primary-400" : "text-text-muted dark:text-text-dark-muted"}`}
                  >
                    Unread
                  </Text>
                  {unreadIds.length > 0 && (
                    <View className="ml-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleMarkAllRead}
              disabled={unreadIds.length === 0}
              className={`flex-row items-center ${unreadIds.length === 0 ? "opacity-30" : ""}`}
            >
              <Check stroke="#59AC77" size={14} strokeWidth={3} />
              <Text className="ml-1.5 text-[11px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">Mark all read</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            {displayList.length === 0 ? (
              <View className="py-20 items-center justify-center">
                <View className="h-20 w-20 items-center justify-center rounded-full bg-surface-muted dark:bg-surface-dark-muted mb-6">
                  <Inbox stroke={isDark ? "#4f5f56" : "#95a39a"} size={32} strokeWidth={2} />
                </View>
                <Text className="text-[20px] font-black tracking-tight text-text-primary dark:text-text-dark-primary text-center">
                  {filter === "unread" ? "No Unread Notifications" : "All Caught Up!"}
                </Text>
                <Text className="mt-2 text-[14px] leading-relaxed text-text-muted dark:text-text-dark-muted text-center px-10">
                  {filter === "unread" 
                    ? "You have read all your recent family updates." 
                    : "Activity from your family members will appear here."}
                </Text>
              </View>
            ) : (
              displayList.map((notif) => {
                const isUnread = !notif.readBy.includes(myUid);
                const { icon: Icon, color, bg } = getIconData(notif.type);

                return (
                  <TouchableOpacity
                    key={notif.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (isUnread) markNotificationsAsRead([notif.id], myUid);
                    }}
                    className="mb-3"
                  >
                    <Card className={`py-4 ${isUnread ? "border-primary-100 dark:border-primary-900/30 bg-primary-50/10 dark:bg-primary-900/10" : ""}`}>
                      <View className="flex-row items-start">
                        <View className={`mr-4 h-11 w-11 items-center justify-center rounded-2xl ${bg}`}>
                          <Icon stroke={color} size={20} strokeWidth={2.5} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between">
                            <Text
                              className={`text-[15px] tracking-tight ${isUnread ? "font-black text-text-primary dark:text-text-dark-primary" : "font-bold text-text-muted dark:text-text-dark-muted"}`}
                            >
                              {notif.title}
                            </Text>
                            <Text className="text-[10px] font-bold text-text-muted dark:text-text-dark-muted uppercase tracking-wider">
                              {formatTime(notif.createdAt)}
                            </Text>
                          </View>
                          <Text
                            className={`mt-1 text-[13px] leading-relaxed ${isUnread ? "text-text-primary dark:text-text-dark-primary font-medium" : "text-text-muted dark:text-text-dark-muted"}`}
                          >
                            {notif.message}
                          </Text>
                        </View>
                        {isUnread && (
                          <View className="ml-3 mt-2 h-2 w-2 rounded-full bg-primary-600" />
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default NotificationModal;
