import "./src/styles/global.css";
import React, { useCallback, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { colorScheme } from "nativewind";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from 'expo-splash-screen';
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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/**
 * Main application component
 * Why: Orchestrates the root configuration including fonts, navigation, and theme.
 */
export default function App() {
    const [fontsLoaded, fontError] = useFonts({
        DMSans_400Regular,
        DMSans_500Medium,
        DMSans_700Bold,
        DMMono_400Regular,
        DMMono_500Medium,
    });

    useEffect(() => {
        // Force Light Mode for stability as per project requirement
        colorScheme.set("light");
    }, []);

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded || fontError) {
            // Hide splash screen once fonts are loaded or an error occurs
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

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
