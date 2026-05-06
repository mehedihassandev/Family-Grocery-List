import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuthStore } from "../store/useAuthStore";
import { listenToAuthChanges } from "../services/auth";
import { RootNavigatorParamList, ERootRoutes } from "../types";

import AuthenticatedNavigator from "./AuthenticatedNavigator";
import UnAuthenticatedNavigator from "./UnAuthenticatedNavigator";
import { navigationRef } from "./navigationRef";
import { LoadingScreen } from "../screens";

const Stack = createNativeStackNavigator<RootNavigatorParamList>();
const MIN_LOADING_SCREEN_MS = 800;

/**
 * Root Navigator Component
 * Why: To centralize navigation configuration and handle authentication state switching.
 * This component mirrors the structure in the reference project.
 */
const Navigator = () => {
  const { user, loading, hasHydrated } = useAuthStore();
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const isAppReady = hasHydrated && !loading && minDelayPassed;

  useEffect(() => {
    // Subscribe to Firebase auth state; unsubscribe on unmount
    const unsubscribe = listenToAuthChanges();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMinDelayPassed(true);
    }, MIN_LOADING_SCREEN_MS);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
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
