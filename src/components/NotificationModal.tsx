import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Bell, Check, ShoppingBag, X, AlertCircle, Inbox } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { markNotificationsAsRead } from "../services/notification";
import { useDateFormatter } from "../hooks";
import { Card } from "./ui";

interface INotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Modal to display recent family activities and notifications
 * Why: To keep users updated on grocery list changes (items added, completed) in a centralized place.
 * @param props - Component props including visibility and close handler
 */
const NotificationModal = ({ visible, onClose }: INotificationModalProps) => {
  const { user } = useAuthStore();
  const { toRelativeTime } = useDateFormatter();
  const notifications = useNotificationStore((state) => state.notifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markReadError, setMarkReadError] = useState<string | null>(null);

  const myUid = user?.uid || "";

  // Filter out actions done by the current user
  const feed = notifications.filter((n) => n.actorId !== myUid);
  const displayList = filter === "unread" ? feed.filter((n) => !n.readBy.includes(myUid)) : feed;
  const unreadIds = feed.filter((n) => !n.readBy.includes(myUid)).map((n) => n.id);

  /**
   * Marks all unread notifications as read by the current user
   */
  const handleMarkAllRead = async () => {
    if (unreadIds.length > 0) {
      try {
        setMarkReadError(null);
        await markNotificationsAsRead(unreadIds, myUid);
      } catch (error) {
        setMarkReadError(error instanceof Error ? error.message : "Could not mark notifications.");
      }
    }
  };

  /**
   * Returns icon and color configuration based on notification type
   * @param type - The notification type
   */
  const getIconData = (type: string) => {
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
          color: "#3DB87A",
          bg: "bg-primary-50",
        };
      case "urgent_item":
        return {
          icon: AlertCircle,
          color: "#ef4444",
          bg: "bg-red-50",
        };
      default:
        return {
          icon: Bell,
          color: "#748379",
          bg: "bg-surface-muted",
        };
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} className="bg-black/40">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="absolute bottom-0 left-0 right-0 top-0"
      />

      <View
        className="max-h-[90%] min-h-[50%] rounded-t-4xl bg-background px-6 pb-12 pt-3"
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
          <View className="h-1 w-9 rounded-full bg-handle" />
        </View>

        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-[2px] text-primary-600">
              Activity Feed
            </Text>
            <Text className="text-[32px] font-black tracking-tight text-text-primary">
              Notifications
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            className="h-11 w-11 items-center justify-center rounded-full bg-surface-muted border border-border-muted"
          >
            <X stroke="#748379" size={20} strokeWidth={3} />
          </TouchableOpacity>
        </View>

        <View className="mb-6 flex-row items-center justify-between border-b border-border-muted/40 pb-4">
          <View className="flex-row items-center bg-surface-muted rounded-xl p-1 border border-border-muted">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setFilter("all")}
              className={`rounded-lg px-4 py-1.5 ${filter === "all" ? "bg-surface shadow-sm" : ""}`}
            >
              <Text
                className={`text-[12px] font-black uppercase tracking-wider ${filter === "all" ? "text-primary-600" : "text-text-muted"}`}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setFilter("unread")}
              className={`rounded-lg px-4 py-1.5 ${filter === "unread" ? "bg-surface shadow-sm" : ""}`}
            >
              <View className="flex-row items-center">
                <Text
                  className={`text-[12px] font-black uppercase tracking-wider ${filter === "unread" ? "text-primary-600" : "text-text-muted"}`}
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
            <Check stroke="#3DB87A" size={14} strokeWidth={3} />
            <Text className="ml-1.5 text-[11px] font-black uppercase tracking-wider text-primary-600">
              Mark all read
            </Text>
          </TouchableOpacity>
        </View>
        {markReadError ? (
          <Text className="mb-2 text-[12px] font-medium text-urgent">{markReadError}</Text>
        ) : null}

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {displayList.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-surface-muted mb-6">
                <Inbox stroke="#95a39a" size={32} strokeWidth={2} />
              </View>
              <Text className="text-[20px] font-black tracking-tight text-text-primary text-center">
                {filter === "unread" ? "No Unread Notifications" : "All Caught Up!"}
              </Text>
              <Text className="mt-2 text-[14px] leading-relaxed text-text-muted text-center px-10">
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
                    if (!isUnread) return;

                    void markNotificationsAsRead([notif.id], myUid).catch((error) => {
                      setMarkReadError(
                        error instanceof Error ? error.message : "Could not mark notification.",
                      );
                    });
                  }}
                  className="mb-3"
                >
                  <Card className={`py-4 ${isUnread ? "border-primary-100 bg-primary-50/10" : ""}`}>
                    <View className="flex-row items-start">
                      <View
                        className={`mr-4 h-11 w-11 items-center justify-center rounded-2xl ${bg}`}
                      >
                        <Icon stroke={color} size={20} strokeWidth={2.5} />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text
                            className={`text-[15px] tracking-tight ${isUnread ? "font-black text-text-primary" : "font-bold text-text-muted"}`}
                          >
                            {notif.title}
                          </Text>
                          <Text className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            {toRelativeTime(notif.createdAt, "Just now")}
                          </Text>
                        </View>
                        <Text
                          className={`mt-1 text-[13px] leading-relaxed ${isUnread ? "text-text-primary font-medium" : "text-text-muted"}`}
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
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
});

export default NotificationModal;
