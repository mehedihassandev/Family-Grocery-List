import React from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

type PrimaryButtonProps = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
};

const PrimaryButton = ({
  title,
  loading = false,
  disabled,
  className,
  ...props
}: PrimaryButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.88}
      disabled={isDisabled}
      className={`w-full flex-row items-center justify-center rounded-2xl bg-primary-600 px-5 py-4 disabled:opacity-60 ${className ?? ""}`}
    >
      {loading ? (
        <ActivityIndicator color="#f6fbf7" />
      ) : (
        <Text className="text-base font-bold text-text-inverse">{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default PrimaryButton;
