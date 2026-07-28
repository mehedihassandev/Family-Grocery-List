import React from "react";
import { Text, View, TouchableOpacity, TouchableOpacityProps } from "react-native";

interface IChipProps extends TouchableOpacityProps {
  label: string;
  count?: number;
  selected?: boolean;
}

/**
 * Reusable Chip component for filters and categories
 * Why: To provide a consistent interactive element for selection with vibrant styling matching MEAL TYPE chips.
 * @param props - Component props including label, optional count, and selection state
 */
const Chip = ({ label, count, selected = false, className, onPress, ...props }: IChipProps) => {
  return (
    <TouchableOpacity
      {...props}
      onPress={onPress}
      activeOpacity={0.75}
      className={`px-4 py-2.5 rounded-xl border flex-row items-center ${
        selected ? "bg-emerald-600 border-emerald-600" : "bg-surface-alt border-border bg-white"
      } ${className ?? ""}`}
    >
      <Text className={`text-xs font-bold ${selected ? "text-white" : "text-text-primary"}`}>
        {label}
      </Text>
      {typeof count === "number" && (
        <View
          className={`ml-1.5 px-2 py-0.5 rounded-full ${
            selected ? "bg-white/20 border border-white/30" : "bg-slate-100"
          }`}
        >
          <Text className={`text-[10px] font-bold ${selected ? "text-white" : "text-slate-500"}`}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Chip;
