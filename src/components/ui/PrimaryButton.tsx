import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";

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
  ...props
}: IPrimaryButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.8}
      disabled={isDisabled}
      className={`w-full flex-row items-center justify-center rounded-2xl h-[52px] px-6 ${
        isDisabled ? "bg-primary-100" : "bg-primary-500"
      } ${className ?? ""}`}
      style={isDisabled ? undefined : styles.enabledShadow}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {icon && <View className="mr-2.5">{icon}</View>}
          <Text
            className={`text-[15px] font-bold tracking-wide ${isDisabled ? "text-primary-300" : "text-white"}`}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  enabledShadow: {
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
});

export default PrimaryButton;
