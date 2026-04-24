import React, { ReactNode } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { Bell, ArrowLeft } from "lucide-react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useColorScheme } from "nativewind";

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

/**
 * Main application header component
 * Why: To provide consistent navigation and branding across all screens.
 * Features: Title, optional eyebrow/subtitle, back button, and notification bell.
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
}: AppHeaderProps) => {
  const { user } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const notifications = useNotificationStore((state) => state.notifications);

  const unreadCount = notifications.filter(
    (n) => n.actorId !== user?.uid && !n.readBy.includes(user?.uid || "")
  ).length;

  const isDark = colorScheme === "dark";

  return (
    <View className="flex-row items-center justify-between border-b border-border-muted/40 dark:border-border-dark bg-background px-6 pb-6 pt-3 dark:bg-background-dark">
      <View className="flex-row items-center flex-1">
        {showBackButton && (
          <TouchableOpacity
            onPress={onBackPress}
            activeOpacity={0.7}
            className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-surface-muted dark:bg-surface-dark-muted border border-border-muted dark:border-border-dark"
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <ArrowLeft stroke={isDark ? "#cbd5cf" : "#748379"} size={22} strokeWidth={3} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          {eyebrow ? (
            <Text className="mb-0.5 text-[10px] font-bold uppercase tracking-[2.5px] text-primary-600 dark:text-primary-400">
              {eyebrow}
            </Text>
          ) : null}
          <Text 
            className="text-[32px] font-black tracking-tight text-text-primary dark:text-text-dark-primary leading-tight"
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-[15px] font-medium text-text-muted dark:text-text-dark-muted leading-5">
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
            activeOpacity={0.7}
            className="h-12 w-12 items-center justify-center rounded-2xl border border-border-muted bg-surface relative dark:border-border-dark dark:bg-surface-dark shadow-sm"
          >
            <Bell stroke={isDark ? "#59AC77" : "#59AC77"} size={22} strokeWidth={2.5} />
            {unreadCount > 0 && (
              <View className="absolute -right-1.5 -top-1.5 h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-1.5 border-4 border-background dark:border-background-dark">
                <Text className="text-[10px] font-black text-white">
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
