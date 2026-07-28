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
  NotificationScreen,
} from "../screens";

const Stack = createNativeStackNavigator<AuthenticatedStackNavigatorParamList>();

/**
 * Authenticated Stack Navigator
 * Why: Isolated stack for logged-in user features.
 * Hosts the bottom tab navigator as its root screen alongside secondary screens and modals.
 */
const AuthenticatedNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Root Bottom Tab Navigator */}
      <Stack.Screen name="Root" component={TabNavigator} />

      {/* Secondary Screens */}
      <Stack.Screen name={ERootRoutes.FAMILY_SETUP} component={FamilySetupScreen} />
      <Stack.Screen name={ERootRoutes.EDIT_PROFILE} component={EditProfileScreen} />
      <Stack.Screen name={ERootRoutes.PRIVACY_SECURITY} component={PrivacySecurityScreen} />
      <Stack.Screen name={ERootRoutes.HELP_SUPPORT} component={HelpSupportScreen} />
      <Stack.Screen name={ERootRoutes.ANALYZE} component={AnalyzeScreen} />
      <Stack.Screen name={ERootRoutes.NOTIFICATIONS} component={NotificationScreen} />

      {/* Modal Overlay Screens */}
      <Stack.Screen name={ERootRoutes.ITEM_DETAIL} component={ItemDetailScreen} />
      <Stack.Screen name={ERootRoutes.EDIT_ITEM} component={EditItemScreen} />
      <Stack.Screen name={ERootRoutes.ADD_ITEM} component={AddItemScreen} />
    </Stack.Navigator>
  );
};

export default AuthenticatedNavigator;
