import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthenticatedStackNavigatorParamList } from "../types";
import { ERootRoutes } from "./routes";

import TabNavigator from "./TabNavigator";
import {
  FamilySetupScreen,
  EditProfileScreen,
  PrivacySecurityScreen,
  HelpSupportScreen,
  ItemDetailScreen,
  EditItemScreen,
  AddItemScreen,
  AnalyzeScreen,
} from "../screens";

const Stack = createNativeStackNavigator<AuthenticatedStackNavigatorParamList>();

/**
 * Authenticated Navigator
 * Why: To provide a structured stack for logged-in users.
 * Hosts the bottom tab navigator as its root and secondary full-screen views.
 */
const AuthenticatedNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Root" component={TabNavigator} />

      {/* Secondary Screens */}
      <Stack.Screen name={ERootRoutes.FAMILY_SETUP} component={FamilySetupScreen} />
      <Stack.Screen name={ERootRoutes.EDIT_PROFILE} component={EditProfileScreen} />
      <Stack.Screen name={ERootRoutes.PRIVACY_SECURITY} component={PrivacySecurityScreen} />
      <Stack.Screen name={ERootRoutes.HELP_SUPPORT} component={HelpSupportScreen} />
      <Stack.Screen name={ERootRoutes.ANALYZE} component={AnalyzeScreen} />

      {/* Screens that were previously Modals */}
      <Stack.Screen
        name={ERootRoutes.ITEM_DETAIL}
        component={ItemDetailScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen
        name={ERootRoutes.EDIT_ITEM}
        component={EditItemScreen}
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name={ERootRoutes.ADD_ITEM} component={AddItemScreen} />
    </Stack.Navigator>
  );
};

export default AuthenticatedNavigator;
