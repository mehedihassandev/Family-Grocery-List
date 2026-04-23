import React, { ReactNode } from "react";
import { View, StyleProp, ViewStyle } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const Card = ({ children, className = "", style }: CardProps) => {
  return (
    <View
      className={`rounded-3xl border border-border-muted bg-surface ${className}`}
      style={[
        {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.02,
          shadowRadius: 8,
          elevation: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
