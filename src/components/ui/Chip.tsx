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
      className={`rounded-full border px-4 py-2 ${
        selected
          ? "border-primary-600 bg-primary-600"
          : "border-border-muted bg-surface"
      } ${className ?? ""}`}
    >
      <Text
        className={`text-xs font-semibold uppercase tracking-wide ${
          selected ? "text-text-inverse" : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default Chip;
