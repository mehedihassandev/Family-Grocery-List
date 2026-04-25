import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

interface ILoadingOverlayProps {
  visible: boolean;
}

/**
 * Elegant, modern loading overlay
 * Why: To provide a clean, visually premium loading state for async actions.
 * @param props - Component props including visibility flag
 */
const LoadingOverlay = ({ visible }: ILoadingOverlayProps) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [visible, rotateAnim]);

  if (!visible) return null;

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.overlay} className="bg-black/10">
      <View className="h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg">
        <Animated.View
          style={{ transform: [{ rotate }] }}
          className="h-10 w-10 rounded-full border-4 border-primary-50 border-t-primary-500"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default LoadingOverlay;
