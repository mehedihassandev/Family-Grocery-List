import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { useAppTheme } from "../../hooks";

interface IPrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  icon?: React.ReactNode;
}

/**
 * Main action button with premium styling
 * Why: To provide a consistent, visually prominent call-to-action component.
 * @param props - Component props including title, loading state, and optional icon
 */
export const PrimaryButton = ({
  title,
  loading = false,
  disabled,
  icon,
  className,
  style,
  ...props
}: IPrimaryButtonProps) => {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;

  const bg = isDisabled ? colors.accentMuted : colors.accent;
  const textColor = isDisabled ? colors.textMuted : colors.white;

  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.8}
      disabled={isDisabled}
      className={`w-full flex-row items-center justify-center rounded-xl h-[52px] px-6 ${className ?? ""}`}
      style={[
        {
          backgroundColor: bg,
          borderRadius: 16,
        },
        !isDisabled && styles.enabledShadow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <View className="mr-2.5">{icon}</View>}
          <Text className="text-[15px] font-extrabold tracking-wide" style={{ color: textColor }}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  enabledShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default PrimaryButton;
