import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BootSplash from "react-native-bootsplash";

import { useAuthStore } from "../store/useAuthStore";
import { listenToAuthChanges } from "../services/auth";
import { RootNavigatorParamList, ERootRoutes } from "../types";

import AuthenticatedNavigator from "./AuthenticatedNavigator";
import UnAuthenticatedNavigator from "./UnAuthenticatedNavigator";
import { ActivityIndicator, View } from "react-native";

const Stack = createNativeStackNavigator<RootNavigatorParamList>();

const LoadingScreen = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f7f4",
    }}
  >
    <ActivityIndicator size="large" color="#10B981" />
  </View>
);

/**
 * Root Navigator Component
 * Why: To centralize navigation configuration and handle authentication state switching.
 * This component mirrors the structure in the reference project.
 */
const Navigator = () => {
  const { user, loading, hasHydrated } = useAuthStore();
  const isAppReady = hasHydrated && !loading;

  useEffect(() => {
    // Subscribe to Firebase auth state; unsubscribe on unmount
    const unsubscribe = listenToAuthChanges();
    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer
      onReady={() => {
        // Only hide the splash screen when navigation is fully mounted.
        // This avoids white flicker on startup.
        void BootSplash.hide({ fade: true });
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAppReady ? (
          <Stack.Screen name={ERootRoutes.LOADING} component={LoadingScreen} />
        ) : !user ? (
          <Stack.Screen name="UnAuthenticatedStack" component={UnAuthenticatedNavigator} />
        ) : (
          <Stack.Screen name="AuthenticatedStack" component={AuthenticatedNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;
