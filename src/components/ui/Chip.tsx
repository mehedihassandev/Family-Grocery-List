import React from "react";
import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

type ChipProps = TouchableOpacityProps & {
  label: string;
  selected?: boolean;
};

/**
 * Reusable Chip component for filters and categories
 * Why: To provide a consistent interactive element for selection.
 * Supports Dark Mode and different states.
 */
const Chip = ({ label, selected = false, className, ...props }: ChipProps) => {
  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.75}
      className={`rounded-sm border px-4 py-2 ${
        selected
          ? "border-primary-500 bg-primary-500 shadow-xs"
          : "border-border-muted bg-surface-muted dark:border-border-dark dark:bg-surface-dark"
      } ${className ?? ""}`}
    >
      <Text
        className={`text-[13px] font-semibold ${
          selected
            ? "text-white"
            : "text-text-500 dark:text-text-dark-secondary"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default Chip;
