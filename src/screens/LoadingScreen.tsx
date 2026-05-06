import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, View } from "react-native";

const SPLASH_ICON = require("../../assets/adaptive-icon.png");

/**
 * Animated app-loading splash screen
 * Why: Preserve branded launch feel while auth/session state initializes.
 */
const LoadingScreen = () => {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0.9)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entranceAnimation = Animated.timing(fadeIn, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0.9,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    entranceAnimation.start();
    breatheLoop.start();
    spinLoop.start();

    return () => {
      entranceAnimation.stop();
      breatheLoop.stop();
      spinLoop.stop();
    };
  }, [fadeIn, breathe, spin]);

  const spinInterpolation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View className="flex-1 items-center justify-center bg-transparent">
      <Animated.View
        style={{
          opacity: fadeIn,
          transform: [{ scale: breathe }],
        }}
        className="items-center justify-center"
      >
        <Animated.View
          style={{ transform: [{ rotate: spinInterpolation }] }}
          className="absolute h-[132px] w-[132px] rounded-full border border-[#10B981]/35"
        />
        <Image
          source={SPLASH_ICON}
          className="h-[96px] w-[96px]"
          resizeMode="contain"
          style={{ tintColor: "#10B981" }}
        />
      </Animated.View>
    </View>
  );
};

export default LoadingScreen;
