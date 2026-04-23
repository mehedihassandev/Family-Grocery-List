import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/useAuthStore";
import { listenToAuthChanges } from "../services/auth";
import type { RootStackParamList } from "../types";

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
    <ActivityIndicator size="large" color="#59AC77" />
  </View>
);

const RootNavigator = () => {
  const { user, loading, hasHydrated } = useAuthStore();

  useEffect(() => {
    // Subscribe to Firebase auth state; unsubscribe on unmount to prevent
    // memory leaks when the component tree tears down during hot-reload.
    const unsubscribe = listenToAuthChanges();
    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!hasHydrated || loading ? (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : !user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="FamilySetup" component={FamilySetupScreen} />
            <Stack.Screen name="JoinFamily" component={JoinFamilyScreen} />
            <Stack.Screen name="CreateFamily" component={CreateFamilyScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
