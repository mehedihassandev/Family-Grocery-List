import React, { ReactNode } from "react";
import { View, StyleProp, ViewStyle, StyleSheet } from "react-native";

interface ICardProps {
  children: ReactNode;
  className?: string; // Kept for compatibility
  style?: StyleProp<ViewStyle>;
  padding?: boolean;
}

/**
 * Standard Card component
 * Why: To maintain consistent layout, radius, and shadows across the app.
 * Improved for a premium look with better radius and shadow.
 * @param props - Component props including children and optional styles
 */
export const Card = ({ children, className, style, padding = true }: ICardProps) => {
  return (
    <View className={className} style={[styles.card, padding && styles.padding, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F0F2F5",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  padding: {
    padding: 20,
  },
});
