import "./src/styles/global.css";
import React, { useEffect, useState } from "react";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Navigator from "./src/navigation";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";

import * as SplashScreen from "expo-splash-screen";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./src/lib/react-query";
import { useAuthStore } from "./src/store/useAuthStore";
import { listenToAuthChanges } from "./src/services/auth";
import { LoadingScreen } from "./src/screens";
import { GlobalLoadingOverlay } from "./src/components/ui";
import { NavigationContainer } from "@react-navigation/native";
import { useSyncAppTheme } from "./src/hooks";

// Keep the splash screen visible while we fetch resources
void SplashScreen.preventAutoHideAsync();

const MIN_LOADING_SCREEN_MS = 800;

/**
 * Main application component
 * Why: Orchestrates the root configuration including fonts, providers, NavigationContainer, main navigator, and global app logo loader overlay.
 */
export default function App() {
  useSyncAppTheme();

  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const isAppReady = hasHydrated && minDelayPassed && authResolved;

  useEffect(() => {
    // Subscribe to Firebase auth state; unsubscribe on unmount
    const unsubscribe = listenToAuthChanges();

    // Listen for the first time the auth store finishes loading
    const unsubStore = useAuthStore.subscribe((state) => {
      if (!state.loading) {
        setAuthResolved(true);
      }
    });

    return () => {
      unsubscribe();
      unsubStore();
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMinDelayPassed(true);
    }, MIN_LOADING_SCREEN_MS);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NavigationContainer>
            {!isAppReady ? <LoadingScreen /> : <Navigator />}
          </NavigationContainer>
          <GlobalLoadingOverlay />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
