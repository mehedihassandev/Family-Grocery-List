import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { UnAuthenticatedStackNavigatorParamList, ROUTES } from "../types";

import LoginScreen from "../screens/LoginScreen";

const Stack = createNativeStackNavigator<UnAuthenticatedStackNavigatorParamList>();

/**
 * Unauthenticated Stack Navigator
 * Why: Isolated stack for logged-out users handling authentication flows (e.g. Login).
 */
const UnAuthenticatedNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
    </Stack.Navigator>
  );
};

export default UnAuthenticatedNavigator;
