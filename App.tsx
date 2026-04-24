import "./src/styles/global.css";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { colorScheme } from "nativewind";
import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";

export default function App() {
    useEffect(() => {
        // Force Light Mode for stability
        colorScheme.set("light");
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NavigationContainer>
                    <RootNavigator />
                </NavigationContainer>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
