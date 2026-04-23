import React, { ReactNode } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { Bell, ArrowLeft } from "lucide-react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
};

const AppHeader = ({
  eyebrow,
  title,
  subtitle,
  right,
  showNotification = true,
  onNotificationPress,
  showBackButton = false,
  onBackPress,
}: AppHeaderProps) => {
  const { user } = useAuthStore();
  const notifications = useNotificationStore((state) => state.notifications);

  const unreadCount = notifications.filter(
    (n) => n.actorId !== user?.uid && !n.readBy.includes(user?.uid || "")
  ).length;

  return (
    <View className="flex-row items-center justify-between border-b border-border-muted bg-surface px-6 pb-4 pt-3">
      <View className="flex-row items-center flex-1">
        {showBackButton && (
          <TouchableOpacity
            onPress={onBackPress}
            className="mr-3 p-1"
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <ArrowLeft stroke="#637889" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          {eyebrow ? (
            <Text className="mb-0.5 text-[10px] font-bold uppercase tracking-[2px] text-primary-600">
              {eyebrow}
            </Text>
          ) : null}
          <Text 
            className="text-[32px] font-extrabold tracking-tight text-text-primary"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-[15px] text-text-secondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="flex-row items-center gap-4 pl-4">
        {right}
        {showNotification && (
          <TouchableOpacity
            onPress={onNotificationPress}
            activeOpacity={0.8}
            className="rounded-full border border-border-muted bg-surface p-2.5 relative"
          >
            <Bell stroke="#59AC77" size={20} strokeWidth={2.2} />
            {unreadCount > 0 && (
              <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-urgent px-1 border-2 border-surface">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AppHeader;
