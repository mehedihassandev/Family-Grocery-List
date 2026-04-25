import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  backgroundColor?: string;
  height?: number;
  label?: string;
  showPercentage?: boolean;
}

/**
 * Animated progress bar with premium styling
 * Why: To visualize progress (e.g., category-wise or overall list completion) in a clean, animated way.
 */
const ProgressBar = ({
  progress,
  color = "#3DB87A",
  backgroundColor = "#F0F2F5",
  height = 8,
  label,
  showPercentage = false,
}: ProgressBarProps) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View className="mb-4">
      {(label || showPercentage) && (
        <View className="flex-row justify-between items-center mb-2">
          {label && (
            <Text className="text-[13px] font-bold text-text-secondary">
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text className="text-[13px] font-bold text-primary-500">
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.container,
          { backgroundColor, height, borderRadius: height / 2 },
        ]}
      >
        <Animated.View
          style={[
            styles.bar,
            {
              backgroundColor: color,
              width: widthInterpolation,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  bar: {
    height: "100%",
  },
});

export default ProgressBar;
