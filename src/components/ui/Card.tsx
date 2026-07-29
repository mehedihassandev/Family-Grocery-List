import React, { ReactNode } from "react";
import { View, StyleProp, ViewStyle, StyleSheet } from "react-native";

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
  return (
    <View
      className={className}
      style={[
        styles.base,
        variant === "outlined" && styles.outlined,
        variant === "flat" && styles.flat,
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
  outlined: {
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
  },
  flat: {
    borderRadius: 16,
    backgroundColor: "#FAFAFA",
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
