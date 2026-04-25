import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BootSplash from "react-native-bootsplash";
import { useAuthStore } from "../store/useAuthStore";
import { listenToAuthChanges } from "../services/auth";
import type { RootStackParamList } from "../types";
import { ERootRoutes } from "./routes";

import LoginScreen from "../screens/LoginScreen";
import TabNavigator from "./TabNavigator";
import FamilySetupScreen from "../screens/FamilySetupScreen";
import JoinFamilyScreen from "../screens/JoinFamilyScreen";
import CreateFamilyScreen from "../screens/CreateFamilyScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import PrivacySecurityScreen from "../screens/PrivacySecurityScreen";
import HelpSupportScreen from "../screens/HelpSupportScreen";

// Generic is passed so every Stack.Screen name and params are type-checked
// at compile time — invalid route names or missing required params become
// TypeScript errors rather than silent runtime crashes.
const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f7f4",
    }}
  >
    <ActivityIndicator size="large" color="#3DB87A" />
  </View>
);

/**
 * Root navigator of the application
 * Why: Orchestrates the main navigation flow including authentication gates.
 */
const RootNavigator = () => {
  const { user, loading, hasHydrated } = useAuthStore();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const hasHiddenBootSplash = useRef(false);
  const isAppReady = hasHydrated && !loading;
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (isNavigationReady) return;

    // Check if navigation is ready on mount or state change
    const checkReady = () => {
      if (navigationRef.isReady()) {
        setIsNavigationReady(true);
      }
    };

    checkReady();
    const unsubscribe = navigationRef.addListener("state", checkReady);
    return unsubscribe;
  }, [navigationRef, isNavigationReady]);

  useEffect(() => {
    // Subscribe to Firebase auth state; unsubscribe on unmount to prevent
    // memory leaks when the component tree tears down during hot-reload.
    const unsubscribe = listenToAuthChanges();
    return () => unsubscribe();
  }, []);

  const hideBootSplash = useCallback(() => {
    if (!isAppReady || !isNavigationReady || hasHiddenBootSplash.current) {
      return;
    }

    hasHiddenBootSplash.current = true;
    void BootSplash.hide({ fade: true });
  }, [isAppReady, isNavigationReady]);

  useEffect(() => {
    hideBootSplash();
  }, [hideBootSplash]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAppReady ? (
        <Stack.Screen name={ERootRoutes.LOADING} component={LoadingScreen} />
      ) : !user ? (
        <Stack.Screen name={ERootRoutes.LOGIN} component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name={ERootRoutes.MAIN} component={TabNavigator} />
          <Stack.Screen name={ERootRoutes.FAMILY_SETUP} component={FamilySetupScreen} />
          <Stack.Screen name={ERootRoutes.JOIN_FAMILY} component={JoinFamilyScreen} />
          <Stack.Screen name={ERootRoutes.CREATE_FAMILY} component={CreateFamilyScreen} />
          <Stack.Screen name={ERootRoutes.EDIT_PROFILE} component={EditProfileScreen} />
          <Stack.Screen name={ERootRoutes.PRIVACY_SECURITY} component={PrivacySecurityScreen} />
          <Stack.Screen name={ERootRoutes.HELP_SUPPORT} component={HelpSupportScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
