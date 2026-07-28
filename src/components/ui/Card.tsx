import React, { ReactNode } from "react";
import { View, StyleProp, ViewStyle, StyleSheet } from "react-native";

interface ICardProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  padding?: boolean;
}

/**
  Standard Card component with high-fidelity visual styling.
  Why: Ensures consistent layout, rounded corners, and shadow elevation across the app.
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
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  padding: {
    padding: 20,
  },
});

export default Card;
