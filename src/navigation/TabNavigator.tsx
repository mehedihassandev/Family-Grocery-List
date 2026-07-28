import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, ShoppingBasket, BarChart3, Users, User as UserIcon } from "lucide-react-native";

import DashboardScreen from "../screens/DashboardScreen";
import GroceryListScreen from "../screens/GroceryListScreen";
import AnalyzeScreen from "../screens/AnalyzeScreen";
import MembersScreen from "../screens/MembersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useAuthStore } from "../store/useAuthStore";
import { syncFamilyInviteForOwner } from "../services/family";

const Tab = createBottomTabNavigator();

const TabIcon = ({ focused, Icon }: { focused: boolean; Icon: any }) => (
  <View style={styles.iconContainer}>
    <Icon stroke={focused ? "#10B981" : "#94A3B8"} size={22} strokeWidth={focused ? 2.5 : 2} />
  </View>
);

/**
 * Standard Bottom Tab Navigator matching my-care-mobile architecture.
 * Uses official @react-navigation/bottom-tabs to inject NavigationContext across all screens.
 */
const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
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

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#10B981",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          height: (Platform.OS === "ios" ? 60 : 56) + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          elevation: 8,
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen as any}
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Home} />,
        }}
      />
      <Tab.Screen
        name="Groceries"
        component={GroceryListScreen as any}
        options={{
          tabBarLabel: "Groceries",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={ShoppingBasket} />,
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyzeScreen as any}
        options={{
          tabBarLabel: "Analytics",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={BarChart3} />,
        }}
      />
      <Tab.Screen
        name="Family"
        component={MembersScreen as any}
        options={{
          tabBarLabel: "Family",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Users} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen as any}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={UserIcon} />,
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
