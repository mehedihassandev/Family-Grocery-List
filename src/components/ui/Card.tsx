import React, { ReactNode } from "react";
import { View, StyleProp, ViewStyle, StyleSheet } from "react-native";
import { useAppTheme } from "../../hooks";

interface ICardProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  padding?: boolean;
  variant?: "outlined" | "flat" | "ghost";
}

/**
  Minimalist Card component with clean, elegant styling.
  Why: Minimizes heavy card-based layouts and provides a borderless or soft-bordered aesthetic.
 */
export const Card = ({
  children,
  className,
  style,
  padding = false,
  variant = "ghost",
}: ICardProps) => {
  const { colors } = useAppTheme();

  return (
    <View
      className={className}
      style={[
        styles.base,
        { borderRadius: 16 },
        variant === "outlined" && { borderWidth: 1, borderColor: colors.border },
        variant === "flat" && { backgroundColor: colors.bgSurface },
        variant === "ghost" && styles.ghost,
        padding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: "transparent",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  padding: {
    padding: 0,
  },
});

export default Card;
