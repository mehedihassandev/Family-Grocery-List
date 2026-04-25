import React, { ReactNode } from "react";
import { View, StyleProp, ViewStyle, StyleSheet } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string; // Kept for compatibility
  style?: StyleProp<ViewStyle>;
  padding?: boolean;
}

/**
 * Standard Card component
 * Why: To maintain consistent layout, radius, and shadows across the app.
 * Simplified and locked to Light Mode for maximum stability.
 */
export const Card = ({ children, className, style, padding = true }: CardProps) => {
  return (
    <View className={className} style={[styles.card, padding && styles.padding, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EBF0", // border
    backgroundColor: "#ffffff", // surface
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  padding: {
    padding: 16,
  },
});
