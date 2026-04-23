import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BarChart3, Home, ShoppingBasket, Users, User as UserIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DashboardScreen from "../screens/DashboardScreen";
import HomeScreen from "../screens/HomeScreen";
import MembersScreen from "../screens/MembersScreen";
import AnalyzeScreen from "../screens/AnalyzeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import type { TabParamList } from "../types";

// Passing TabParamList ensures tab names match the declared param list;
// mistyped screen names become TypeScript errors at compile time.
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICON_SIZE = 20;
const TAB_ICON_STROKE_WIDTH = 2.5;
const TAB_LABEL_FONT_SIZE = 11;

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(insets.bottom, 10);
  const { user } = useAuthStore();
  const initNotifications = useNotificationStore((state) => state.init);
  const clearNotifications = useNotificationStore((state) => state.clear);

  useEffect(() => {
    // Re-initialise or clear the notification listener whenever the family
    // changes (e.g. user joins/leaves a family while the app is open).
    if (user?.familyId) {
      initNotifications(user.familyId);
    } else {
      clearNotifications();
    }
  }, [clearNotifications, initNotifications, user?.familyId]);

  return (
    <Tab.Navigator
      // When the user leaves a family while focused on a family-only tab,
      // remount the navigator so it cleanly resets to the available routes.
      key={user?.familyId ? "family-tabs" : "no-family-tabs"}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#59AC77",
        tabBarInactiveTintColor: "#95a39a",
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          borderRadius: 0,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          height: 42 + tabBarPaddingBottom,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 6,
          borderTopWidth: 1,
          shadowColor: "#4f5f56",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 5,
          borderColor: "rgba(184, 198, 189, 0.35)",
        },
        tabBarLabelStyle: {
          fontSize: TAB_LABEL_FONT_SIZE,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Home stroke={color} size={TAB_ICON_SIZE} strokeWidth={TAB_ICON_STROKE_WIDTH} />
          ),
        }}
      />

      {user?.familyId ? (
        <>
          <Tab.Screen
            name="List"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <ShoppingBasket
                  stroke={color}
                  size={TAB_ICON_SIZE}
                  strokeWidth={TAB_ICON_STROKE_WIDTH}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Members"
            component={MembersScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <Users stroke={color} size={TAB_ICON_SIZE} strokeWidth={TAB_ICON_STROKE_WIDTH} />
              ),
            }}
          />
          <Tab.Screen
            name="Analyze"
            component={AnalyzeScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <BarChart3
                  stroke={color}
                  size={TAB_ICON_SIZE}
                  strokeWidth={TAB_ICON_STROKE_WIDTH}
                />
              ),
            }}
          />
        </>
      ) : null}

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <UserIcon stroke={color} size={TAB_ICON_SIZE} strokeWidth={TAB_ICON_STROKE_WIDTH} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
