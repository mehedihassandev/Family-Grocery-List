import React, { ReactNode } from "react";
import { Text, View, TouchableOpacity, Image } from "react-native";
import { Bell, ArrowLeft } from "lucide-react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import { useUnreadNotificationCountQuery } from "../../hooks/queries/useNotificationQueries";
import { useAppTheme } from "../../hooks";

interface IAppHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  showProfileAvatar?: boolean;
  onProfilePress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const AppHeader = ({
  eyebrow,
  title,
  subtitle,
  right,
  showNotification = true,
  onNotificationPress,
  showProfileAvatar = true,
  onProfilePress,
  showBackButton = false,
  onBackPress,
}: IAppHeaderProps) => {
  const { colors } = useAppTheme();
  const { user } = useAuthStore();
  const notifications = useNotificationStore((state) => state.notifications);
  const { data: unreadData } = useUnreadNotificationCountQuery(user?.familyId);

  const apiUnreadCount = unreadData?.unreadCount;

  const fallbackUnreadCount = notifications.filter(
    (n) => n.actorId !== user?.uid && !n.readBy.includes(user?.uid || ""),
  ).length;

  const unreadCount = typeof apiUnreadCount === "number" ? apiUnreadCount : fallbackUnreadCount;
  const initial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U";

  return (
    <View
      className="flex-row items-center justify-between px-5 pb-3 pt-2 border-b"
      style={{ backgroundColor: colors.bgCanvas, borderBottomColor: colors.borderSubtle }}
    >
      <View className="flex-row items-center flex-1 mr-2">
        {showBackButton && (
          <TouchableOpacity
            onPress={onBackPress}
            activeOpacity={0.75}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full border shadow-xs"
            style={{ backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <ArrowLeft stroke={colors.textPrimary} size={20} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          {eyebrow ? (
            <Text
              className="mb-0.5 text-[11px] font-extrabold uppercase tracking-widest"
              style={{ color: colors.textMuted }}
            >
              {eyebrow}
            </Text>
          ) : null}
          <Text
            className="text-2xl font-black tracking-tight leading-tight"
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="mt-0.5 text-[13px] font-medium leading-5"
              style={{ color: colors.textSecondary }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View className="flex-row items-center gap-2.5">
        {right}
        {showNotification && (
          <TouchableOpacity
            onPress={onNotificationPress}
            activeOpacity={0.75}
            className="h-10 w-10 items-center justify-center rounded-full border shadow-xs relative"
            style={{ backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }}
          >
            <Bell stroke={colors.textPrimary} size={19} strokeWidth={2} />
            {unreadCount > 0 && (
              <View
                className="absolute -right-0.5 -top-0.5 h-4 min-w-[16px] items-center justify-center rounded-full px-1 border"
                style={{ backgroundColor: colors.danger, borderColor: colors.bgCanvas }}
              >
                <Text className="text-[9px] font-black text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {showProfileAvatar && (
          <TouchableOpacity
            onPress={onProfilePress}
            activeOpacity={0.8}
            className="h-10 w-10 items-center justify-center rounded-full overflow-hidden border shadow-xs"
            style={{ backgroundColor: colors.accent, borderColor: colors.borderSubtle }}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" />
            ) : (
              <Text className="text-white font-black text-sm">{initial}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AppHeader;
