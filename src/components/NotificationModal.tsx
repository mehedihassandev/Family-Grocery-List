import React, { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Bell, Check, ShoppingBag, X, AlertCircle } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { markNotificationsAsRead } from "../services/notification";
import { formatDistanceToNow } from "date-fns";

type NotificationModalProps = {
  visible: boolean;
  onClose: () => void;
};

const NotificationModal = ({ visible, onClose }: NotificationModalProps) => {
  const { user } = useAuthStore();
  const notifications = useNotificationStore((state) => state.notifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const myUid = user?.uid || "";

  // Filter out actions done by the current user so they don't see their own notifications
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

  const getIconData = (type: string, isUnread: boolean) => {
    switch (type) {
      case "item_added":
        return {
          icon: ShoppingBag,
          color: "#3b82f6",
          bg: "bg-blue-50",
        };
      case "item_completed":
        return {
          icon: Check,
          color: "#59AC77",
          bg: "bg-primary-50",
        };
      case "urgent_item":
        return {
          icon: AlertCircle,
          color: "#c36262",
          bg: "bg-urgent/10",
        };
      default:
        return {
          icon: Bell,
          color: "#95a39a",
          bg: "bg-border-muted/30",
        };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute bottom-0 left-0 right-0 top-0"
        />

        <View
          className="max-h-[90%] min-h-[60%] rounded-t-3xl bg-surface px-6 pb-12 pt-4"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 15,
          }}
        >
          {/* Handle bar */}
          <View className="mb-4 items-center">
            <View className="h-1.5 w-12 rounded-full bg-border-muted" />
          </View>

          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-[28px] font-black tracking-tight text-text-primary">
                Notifications
              </Text>
              <Text
                className={`mt-1 text-[15px] font-medium ${unreadIds.length > 0 ? "text-primary-700" : "text-text-secondary"}`}
              >
                {unreadIds.length === 0
                  ? "You're all caught up!"
                  : `You have ${unreadIds.length} unread ${unreadIds.length === 1 ? "message" : "messages"}`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              className="rounded-full bg-border-subtle p-2.5"
            >
              <X stroke="#637889" size={20} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <View className="mb-4 flex-row items-center justify-between border-b border-border-muted pb-4">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setFilter("all")}
                className={`rounded-full px-4 py-1.5 ${filter === "all" ? "bg-primary-700" : "bg-surface border border-border-muted"}`}
              >
                <Text
                  className={`text-[13px] font-semibold ${filter === "all" ? "text-text-inverse" : "text-text-secondary"}`}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setFilter("unread")}
                className={`rounded-full px-4 py-1.5 ${filter === "unread" ? "bg-primary-700" : "bg-surface border border-border-muted"}`}
              >
                <Text
                  className={`text-[13px] font-semibold ${filter === "unread" ? "text-text-inverse" : "text-text-secondary"}`}
                >
                  Unread
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleMarkAllRead}
              disabled={unreadIds.length === 0}
              className={`flex-row items-center ${unreadIds.length === 0 ? "opacity-40" : ""}`}
            >
              <Check stroke="#59AC77" size={16} strokeWidth={2.5} />
              <Text className="ml-1 text-[13px] font-semibold text-primary-700">Mark all read</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {displayList.length === 0 ? (
              <View className="py-12 items-center justify-center">
                <Bell stroke="#b8c6bd" size={40} strokeWidth={1.5} />
                <Text className="mt-4 text-[16px] font-bold text-text-secondary">
                  No notifications yet
                </Text>
                <Text className="mt-1 text-[13px] text-text-muted text-center px-8">
                  When family members add or complete items, they&apos;ll show up here.
                </Text>
              </View>
            ) : (
              displayList.map((notif) => {
                const isUnread = !notif.readBy.includes(myUid);
                const { icon: Icon, color, bg } = getIconData(notif.type, isUnread);

                return (
                  <TouchableOpacity
                    key={notif.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (isUnread) markNotificationsAsRead([notif.id], myUid);
                    }}
                    className={`mb-3 flex-row items-start rounded-2xl border bg-surface p-4 ${
                      isUnread ? "border-primary-200" : "border-border-muted"
                    }`}
                  >
                    <View className={`mr-4 rounded-full p-2.5 ${bg}`}>
                      <Icon stroke={color} size={20} strokeWidth={2.2} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`text-[16px] tracking-tight ${isUnread ? "font-black text-text-primary" : "font-bold text-text-secondary"}`}
                        >
                          {notif.title}
                        </Text>
                        <Text className="text-[12px] font-medium text-text-muted">
                          {formatTime(notif.createdAt)}
                        </Text>
                      </View>
                      <Text
                        className={`mt-1 text-[14px] leading-5 ${isUnread ? "text-text-primary font-medium" : "text-text-secondary"}`}
                      >
                        {notif.message}
                      </Text>
                    </View>
                    {isUnread && (
                      <View className="ml-3 mt-2 h-2.5 w-2.5 rounded-full bg-primary-600" />
                    )}
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
