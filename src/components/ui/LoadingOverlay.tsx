import React, { useEffect, useRef } from "react";
import { StyleSheet, Animated, Easing, Image } from "react-native";
import { useAppTheme } from "../../hooks";

const APP_LOGO = require("../../../assets/adaptive-icon.png");

interface ILoadingOverlayProps {
  visible: boolean;
}

/**
 * Modern, Elegant Transparent App Logo Loader Overlay
 * Features the exact app logo with increased size, soft ambient accent glow aura,
 * elastic spring zoom entrance/exit, and silky breathing pulse animation.
 */
const LoadingOverlay = ({ visible }: ILoadingOverlayProps) => {
  const { colors } = useAppTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const zoomAnim = useRef(new Animated.Value(0.4)).current;
  const pulseAnim = useRef(new Animated.Value(0.93)).current;
  const glowPulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let glowLoop: Animated.CompositeAnimation | null = null;

    if (visible) {
      // 1. Elastic Spring Zoom & Fade-In Entrance
      Animated.parallel([
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
      ]).start();

      // 2. Silky Breathing Pulse for App Logo
      pulseLoop = Animated.loop(
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

      // 3. Ambient Glow Aura Pulse
      glowLoop = Animated.loop(
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

      pulseLoop.start();
      glowLoop.start();
    } else {
      // Smooth Fade & Zoom-Out Exit
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(zoomAnim, {
          toValue: 0.4,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        pulseAnim.setValue(0.93);
        glowPulse.setValue(0.85);
      });
    }

    return () => {
      pulseLoop?.stop();
      glowLoop?.stop();
    };
  }, [visible, fadeAnim, zoomAnim, pulseAnim, glowPulse]);

  if (!visible && (fadeAnim as unknown as { _value?: number })._value === 0) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    zIndex: 99999,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
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

export default LoadingOverlay;
