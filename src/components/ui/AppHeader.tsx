import React, { ReactNode } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { Bell, ArrowLeft } from "lucide-react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useUnreadNotificationCountQuery } from "../../hooks/queries/useNotificationQueries";

interface IAppHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

/**
 * Main application header component
 * Why: To provide consistent navigation and branding across all screens.
 * Features: Title, optional eyebrow/subtitle, back button, and notification bell.
 * @param props - Component props including title, eyebrow, and interaction handlers
 */
const AppHeader = ({
  eyebrow,
  title,
  subtitle,
  right,
  showNotification = true,
  onNotificationPress,
  showBackButton = false,
  onBackPress,
}: IAppHeaderProps) => {
  const { user } = useAuthStore();
  const notifications = useNotificationStore((state) => state.notifications);
  const { data: unreadData } = useUnreadNotificationCountQuery(user?.familyId);

  const apiUnreadCount = unreadData?.unreadCount;

  const fallbackUnreadCount = notifications.filter(
    (n) => n.actorId !== user?.uid && !n.readBy.includes(user?.uid || ""),
  ).length;

  const unreadCount = typeof apiUnreadCount === "number" ? apiUnreadCount : fallbackUnreadCount;

  return (
    <View className="flex-row items-center justify-between border-b border-border/80 bg-background px-6 pb-4 pt-2">
      <View className="flex-row items-center flex-1">
        {showBackButton && (
          <TouchableOpacity
            onPress={onBackPress}
            activeOpacity={0.7}
            className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-white border border-border shadow-xs"
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <ArrowLeft stroke="#475569" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          {eyebrow ? (
            <Text className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-primary-500">
              {eyebrow}
            </Text>
          ) : null}
          <Text
            className="text-[28px] font-bold tracking-tight text-text-900 leading-tight"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-[13px] font-medium text-text-muted leading-5">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="flex-row items-center gap-3 pl-3">
        {right}
        {showNotification && (
          <TouchableOpacity
            onPress={onNotificationPress}
            activeOpacity={0.7}
            className="h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white relative shadow-xs"
          >
            <Bell stroke="#10B981" size={22} strokeWidth={2.2} />
            {unreadCount > 0 && (
              <View className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 border-2 border-white">
                <Text className="text-[9px] font-bold text-white">
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
