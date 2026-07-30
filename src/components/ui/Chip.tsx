import React from "react";
import { Text, View, TouchableOpacity, TouchableOpacityProps, StyleSheet } from "react-native";
import { useAppTheme } from "../../hooks";

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
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      {...props}
      onPress={onPress}
      activeOpacity={0.75}
      className={`px-4 py-2.5 rounded-xl border flex-row items-center ${className ?? ""}`}
      style={
        selected
          ? { backgroundColor: colors.accent, borderColor: colors.accent }
          : { backgroundColor: colors.bgCard, borderColor: colors.border }
      }
    >
      <Text
        className="text-xs font-bold"
        style={{ color: selected ? colors.white : colors.textPrimary }}
      >
        {label}
      </Text>
      {typeof count === "number" && (
        <View
          className="ml-1.5 px-2 py-0.5 rounded-full"
          style={selected ? chipStyles.selectedCountBadge : { backgroundColor: colors.bgInput }}
        >
          <Text
            className="text-[10px] font-bold"
            style={{ color: selected ? colors.white : colors.textMuted }}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Why inline styles instead of NativeWind `bg-white/20` / `border-white/30`:
 * NativeWind v4 CSS interop breaks React's Context tree when fractional
 * opacity color classes are conditionally toggled.
 */
const chipStyles = StyleSheet.create({
  selectedCountBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
});

export default Chip;
