import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, View, StyleSheet } from "react-native";
import { useAppTheme } from "../hooks";

const APP_LOGO = require("../../assets/adaptive-icon.png");

/**
 * Animated app-loading splash screen
 * Features increased app logo size (84px), soft ambient accent glow aura, and spring zoom entrance.
 */
const LoadingScreen = () => {
  const { colors } = useAppTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(0.4)).current;
  const pulseAnim = useRef(new Animated.Value(0.93)).current;
  const glowPulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const entranceAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(zoomAnim, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
    ]);

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 750,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.93,
          duration: 750,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1.25,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.85,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    entranceAnimation.start();
    pulseLoop.start();
    glowLoop.start();

    return () => {
      entranceAnimation.stop();
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, [fadeAnim, zoomAnim, pulseAnim, glowPulse]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: zoomAnim }],
          },
        ]}
      >
        {/* Soft Ambient Accent Glow Aura */}
        <Animated.View
          style={[
            styles.glowAura,
            {
              backgroundColor: colors.accent,
              transform: [{ scale: glowPulse }],
            },
          ]}
        />

        {/* Pulsing Modern App Logo */}
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={APP_LOGO}
            style={[styles.logoImage, { tintColor: colors.accent }]}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowAura: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.2,
  },
  logoWrapper: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 84,
    height: 84,
  },
});

export default LoadingScreen;
