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
      activeOpacity={0.85}
      className={`rounded-full border px-4 py-2.5 ${
        selected
          ? "border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20"
          : "border-border-muted/80 bg-surface dark:border-border-dark dark:bg-surface-dark"
      } ${className ?? ""}`}
    >
      <Text
        className={`text-[13px] font-semibold ${
          selected
            ? "text-primary-700 dark:text-primary-400"
            : "text-text-secondary dark:text-text-dark-secondary"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default Chip;
