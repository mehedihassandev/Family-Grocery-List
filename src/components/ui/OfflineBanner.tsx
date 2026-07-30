import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { WifiOff, RefreshCw } from "lucide-react-native";
import { useAppTheme } from "../../hooks";

interface IOfflineBannerProps {
  onRetry?: () => void;
  isOfflineOverride?: boolean;
}

/**
 * Non-intrusive Offline Status Banner
 * Why: Reassures users in low-reception store basements that local changes persist.
 */
export const OfflineBanner: React.FC<IOfflineBannerProps> = ({ onRetry, isOfflineOverride }) => {
  const { colors } = useAppTheme();
  const [isOffline, setIsOffline] = useState(isOfflineOverride || false);

  useEffect(() => {
    if (typeof isOfflineOverride === "boolean") {
      setIsOffline(isOfflineOverride);
    }
  }, [isOfflineOverride]);

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className="px-4 py-2.5 flex-row items-center justify-between border-b"
      style={{ backgroundColor: colors.warning, borderBottomColor: `${colors.warning}33` }}
      accessibilityRole="alert"
      accessibilityLabel="You are currently offline. Changes will sync automatically when reconnected."
    >
      <View className="flex-row items-center flex-1 mr-2">
        <WifiOff stroke={colors.white} size={16} strokeWidth={2.5} className="mr-2" />
        <Text className="text-white text-[12px] font-extrabold flex-1">
          Offline Mode · Changes will sync automatically
        </Text>
      </View>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Retry Connection"
          className="bg-white/20 px-2.5 py-1 rounded-full flex-row items-center"
        >
          <RefreshCw stroke={colors.white} size={11} strokeWidth={2.5} className="mr-1" />
          <Text className="text-white text-[11px] font-extrabold">Retry</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
};
