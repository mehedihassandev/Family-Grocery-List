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
            className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-slate-50 border border-slate-100"
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <ArrowLeft stroke="#475569" size={18} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          {eyebrow ? (
            <Text className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-600">
              {eyebrow}
            </Text>
          ) : null}
          <Text
            className="text-[26px] font-extrabold tracking-tight text-slate-900 leading-tight"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-[13px] font-medium text-slate-500 leading-5">
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
            className="h-9 w-9 items-center justify-center rounded-full border border-slate-100 bg-slate-50 relative"
          >
            <Bell stroke="#059669" size={18} strokeWidth={2} />
            {unreadCount > 0 && (
              <View className="absolute -right-1 -top-1 h-3.5 min-w-[14px] items-center justify-center rounded-full bg-rose-500 px-1 border border-white">
                <Text className="text-[8px] font-bold text-white">
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
