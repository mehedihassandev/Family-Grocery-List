import "./src/styles/global.css";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Navigator from "./src/navigation";
import { 
  useFonts, 
  DMSans_400Regular, 
  DMSans_500Medium, 
  DMSans_700Bold 
} from '@expo-google-fonts/dm-sans';
import { 
  DMMono_400Regular, 
  DMMono_500Medium 
} from '@expo-google-fonts/dm-mono';

import * as SplashScreen from 'expo-splash-screen';

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./src/lib/react-query";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/**
 * Main application component
 * Why: Orchestrates the root configuration including fonts and providers.
 * Navigation logic is centralized in src/navigation/index.tsx.
 */
export default function App() {
    const [fontsLoaded, fontError] = useFonts({
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_700Bold,
        DMMono_400Regular,
        DMMono_500Medium,
    });

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <SafeAreaProvider>
                    <Navigator />
                </SafeAreaProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
