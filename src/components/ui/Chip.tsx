import React from "react";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

type ChipProps = TouchableOpacityProps & {
  label: string;
  selected?: boolean;
};

const Chip = ({ label, selected = false, className, ...props }: ChipProps) => {
  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.85}
      className={`rounded-full border px-4 py-2.5 ${
        selected
          ? "border-primary-300 bg-primary-50"
          : "border-border-muted/80 bg-surface"
      } ${className ?? ""}`}
    >
      <Text
        className={`text-[13px] font-semibold ${
          selected ? "text-primary-700" : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default Chip;
