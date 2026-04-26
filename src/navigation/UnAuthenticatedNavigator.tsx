import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { UnAuthenticatedStackNavigatorParamList } from "../types";
import { ERootRoutes } from "./routes";

import LoginScreen from "../screens/LoginScreen";

const Stack = createNativeStackNavigator<UnAuthenticatedStackNavigatorParamList>();

/**
 * Unauthenticated Navigator
 * Why: To isolate the login flow from the main application.
 */
export const UnAuthenticatedNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ERootRoutes.LOGIN} component={LoginScreen} />
    </Stack.Navigator>
  );
};

export default UnAuthenticatedNavigator;
