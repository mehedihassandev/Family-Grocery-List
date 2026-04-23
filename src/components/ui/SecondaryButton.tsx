import React from "react";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

type SecondaryButtonProps = TouchableOpacityProps & {
  title: string;
};

const SecondaryButton = ({
  title,
  className,
  ...props
}: SecondaryButtonProps) => {
  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.88}
      className={`w-full flex-row items-center justify-center rounded-2xl border border-border bg-surface px-5 py-4 ${className ?? ""}`}
    >
      <Text className="text-base font-semibold text-text-secondary">
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default SecondaryButton;
