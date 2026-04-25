import React from "react";
import {
  ActivityIndicator,
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
      activeOpacity={0.75}
      disabled={isDisabled}
      className={`w-full flex-row items-center justify-center rounded-full h-[52px] px-5 ${
        isDisabled 
          ? "bg-primary-100" 
          : "bg-primary-500 shadow-green"
      } ${className ?? ""}`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`text-[15px] font-bold ${isDisabled ? "text-primary-300" : "text-white"}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default PrimaryButton;
