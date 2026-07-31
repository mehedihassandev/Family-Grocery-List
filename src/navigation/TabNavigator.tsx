import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutGrid, ShoppingBag, BarChart3, Users, User as UserIcon } from "lucide-react-native";

import DashboardScreen from "../screens/DashboardScreen";
import GroceryListScreen from "../screens/GroceryListScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import FamilyScreen from "../screens/FamilyScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useAuthStore } from "../store/useAuthStore";
import { useAppTheme } from "../hooks/useAppTheme";
import { syncFamilyInviteForOwner } from "../services/family";
import { ROUTES } from "../types";

const Tab = createBottomTabNavigator();

const TabIcon = ({
  focused,
  Icon,
  activeColor,
  inactiveColor,
}: {
  focused: boolean;
  Icon: any;
  activeColor: string;
  inactiveColor: string;
}) => (
  <View style={styles.iconContainer}>
    <Icon
      stroke={focused ? activeColor : inactiveColor}
      size={22}
      strokeWidth={focused ? 2.5 : 2}
    />
  </View>
);

/**
 * Standard Bottom Tab Navigator matching app architecture.
 * Uses official @react-navigation/bottom-tabs to inject NavigationContext across all screens.
 */
const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useAppTheme();
  const { user, profileSynced, loading, hasHydrated } = useAuthStore();
  const familyId = user?.familyId || "";

  useEffect(() => {
    if (
      !hasHydrated ||
      loading ||
      !profileSynced ||
      !user?.uid ||
      !familyId ||
      user.role !== "owner"
    ) {
      return;
    }
    void syncFamilyInviteForOwner(familyId, user.uid).catch((error) => {
      if (__DEV__) {
        console.warn("Owner invite sync failed:", error);
      }
    });
  }, [hasHydrated, loading, familyId, profileSynced, user?.role, user?.uid]);

  const backgroundColor = colors.bgCanvas;
  const surfaceColor = colors.tabBarBg;
  const borderColor = colors.tabBarBorder;
  const inactiveTextColor = colors.icon;
  const activeTextColor = colors.accent;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor },
        tabBarActiveTintColor: activeTextColor,
        tabBarInactiveTintColor: inactiveTextColor,
        tabBarStyle: {
          height: (Platform.OS === "ios" ? 62 : 58) + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
          backgroundColor: surfaceColor,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          elevation: 8,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.04,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          marginTop: 2,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tab.Screen
        name={ROUTES.DASHBOARD}
        component={DashboardScreen as any}
        options={{
          tabBarLabel: "DASH",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              Icon={LayoutGrid}
              activeColor={activeTextColor}
              inactiveColor={inactiveTextColor}
            />
          ),
        }}
      />
      <Tab.Screen
        name={ROUTES.GROCERIES}
        component={GroceryListScreen as any}
        options={{
          tabBarLabel: "SHOP",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              Icon={ShoppingBag}
              activeColor={activeTextColor}
              inactiveColor={inactiveTextColor}
            />
          ),
        }}
      />
      <Tab.Screen
        name={ROUTES.ANALYTICS}
        component={AnalyticsScreen as any}
        options={{
          tabBarLabel: "STATS",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              Icon={BarChart3}
              activeColor={activeTextColor}
              inactiveColor={inactiveTextColor}
            />
          ),
        }}
      />
      <Tab.Screen
        name={ROUTES.FAMILY}
        component={FamilyScreen as any}
        options={{
          tabBarLabel: "FAMILY",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              Icon={Users}
              activeColor={activeTextColor}
              inactiveColor={inactiveTextColor}
            />
          ),
        }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen as any}
        options={{
          tabBarLabel: "ME",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              Icon={UserIcon}
              activeColor={activeTextColor}
              inactiveColor={inactiveTextColor}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TabNavigator;
