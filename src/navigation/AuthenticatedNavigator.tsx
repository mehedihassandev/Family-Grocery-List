import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthenticatedStackNavigatorParamList } from "../types";
import { ERootRoutes } from "./routes";

import TabNavigator from "./TabNavigator";
import FamilySetupScreen from "../screens/FamilySetupScreen";
import CreateFamilyScreen from "../screens/CreateFamilyScreen";
import JoinFamilyScreen from "../screens/JoinFamilyScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import PrivacySecurityScreen from "../screens/PrivacySecurityScreen";
import HelpSupportScreen from "../screens/HelpSupportScreen";
import ItemDetailScreen from "../screens/ItemDetailScreen";
import EditItemScreen from "../screens/EditItemScreen";

const Stack = createNativeStackNavigator<AuthenticatedStackNavigatorParamList>();

/**
 * Authenticated Navigator
 * Why: To provide a structured stack for logged-in users.
 * Hosts the bottom tab navigator as its root and secondary full-screen views.
 */
export const AuthenticatedNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Root" component={TabNavigator} />
      
      {/* Secondary Screens */}
      <Stack.Screen name={ERootRoutes.FAMILY_SETUP} component={FamilySetupScreen} />
      <Stack.Screen name={ERootRoutes.CREATE_FAMILY} component={CreateFamilyScreen} />
      <Stack.Screen name={ERootRoutes.JOIN_FAMILY} component={JoinFamilyScreen} />
      <Stack.Screen name={ERootRoutes.EDIT_PROFILE} component={EditProfileScreen} />
      <Stack.Screen name={ERootRoutes.PRIVACY_SECURITY} component={PrivacySecurityScreen} />
      <Stack.Screen name={ERootRoutes.HELP_SUPPORT} component={HelpSupportScreen} />
      
      {/* Screens that were previously Modals */}
      <Stack.Screen 
        name="ItemDetail" 
        component={ItemDetailScreen} 
        options={{ presentation: "modal" }} 
      />
      <Stack.Screen 
        name="EditItem" 
        component={EditItemScreen} 
        options={{ presentation: "modal" }} 
      />
    </Stack.Navigator>
  );
};

export default AuthenticatedNavigator;
