import "./src/styles/global.css";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { NavigationContainer } from "@react-navigation/native";
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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/**
 * Main application component
 * Why: Orchestrates the root configuration including fonts and navigation.
 * Note: Theme-related logic (Dark/Light mode) has been completely removed to enforce a single light theme.
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

    const onLayoutRootView = async () => {
        if (fontsLoaded || fontError) {
            await SplashScreen.hideAsync();
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <SafeAreaProvider>
                <NavigationContainer>
                    <RootNavigator />
                </NavigationContainer>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
