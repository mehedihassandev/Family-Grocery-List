import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthenticatedStackNavigatorParamList, ROUTES } from "../types";
import { useAppTheme } from "../hooks";

import TabNavigator from "./TabNavigator";
import {
  FamilySetupScreen,
  EditProfileScreen,
  PrivacySecurityScreen,
  HelpSupportScreen,
  ItemDetailScreen,
  EditItemScreen,
  AddItemScreen,
  AnalyticsScreen,
  NotificationScreen,
  RecipePacksScreen,
  StoreComparisonScreen,
  ProfileScreen,
  MealPlanScreen,
  RecipeDetailScreen,
  CookingModeScreen,
} from "../screens";

const Stack = createNativeStackNavigator<AuthenticatedStackNavigatorParamList>();

/**
 * Authenticated Stack Navigator
 * Why: Isolated stack for logged-in user features.
 * Hosts the bottom tab navigator as its root screen alongside secondary screens and modals.
 */
const AuthenticatedNavigator = () => {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bgCanvas },
      }}
    >
      {/* Root Bottom Tab Navigator */}
      <Stack.Screen name={ROUTES.ROOT} component={TabNavigator} />

      {/* Secondary Screens */}
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen as any} />
      <Stack.Screen name={ROUTES.FAMILY_SETUP} component={FamilySetupScreen} />
      <Stack.Screen name={ROUTES.EDIT_PROFILE} component={EditProfileScreen} />
      <Stack.Screen name={ROUTES.PRIVACY_SECURITY} component={PrivacySecurityScreen} />
      <Stack.Screen name={ROUTES.HELP_SUPPORT} component={HelpSupportScreen} />
      <Stack.Screen name={ROUTES.ANALYZE} component={AnalyticsScreen} />
      <Stack.Screen name={ROUTES.NOTIFICATIONS} component={NotificationScreen} />
      <Stack.Screen name={ROUTES.RECIPE_PACKS} component={RecipePacksScreen} />
      <Stack.Screen name={ROUTES.STORE_COMPARISON} component={StoreComparisonScreen} />
      <Stack.Screen name={ROUTES.MEAL_PLAN} component={MealPlanScreen} />
      <Stack.Screen name={ROUTES.RECIPE_DETAIL} component={RecipeDetailScreen} />
      <Stack.Screen name={ROUTES.COOKING_MODE} component={CookingModeScreen} />

      {/* Modal Overlay Screens */}
      <Stack.Screen name={ROUTES.ITEM_DETAIL} component={ItemDetailScreen} />
      <Stack.Screen name={ROUTES.EDIT_ITEM} component={EditItemScreen} />
      <Stack.Screen name={ROUTES.ADD_ITEM} component={AddItemScreen} />
    </Stack.Navigator>
  );
};

export default AuthenticatedNavigator;
