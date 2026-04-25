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
import { View } from "react-native";

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
        tabBarActiveTintColor: "#3DB87A",
        tabBarInactiveTintColor: "#9AA3AF",
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFFFFF",
          height: 60 + tabBarPaddingBottom,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "#E8EBF0",
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              {focused && (
                <View className="absolute -top-[12px] h-[3px] w-5 rounded-full bg-primary-500" />
              )}
              <Home stroke={color} size={TAB_ICON_SIZE} strokeWidth={TAB_ICON_STROKE_WIDTH} />
            </View>
          ),
        }}
      />

      {user?.familyId ? (
        <>
          <Tab.Screen
            name="List"
            component={HomeScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <View className="items-center">
                  {focused && (
                    <View className="absolute -top-[12px] h-[3px] w-5 rounded-full bg-primary-500" />
                  )}
                  <ShoppingBasket
                    stroke={color}
                    size={TAB_ICON_SIZE}
                    strokeWidth={TAB_ICON_STROKE_WIDTH}
                  />
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Members"
            component={MembersScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <View className="items-center">
                  {focused && (
                    <View className="absolute -top-[12px] h-[3px] w-5 rounded-full bg-primary-500" />
                  )}
                  <Users stroke={color} size={TAB_ICON_SIZE} strokeWidth={TAB_ICON_STROKE_WIDTH} />
                </View>
              ),
            }}
          />
          <Tab.Screen
            name="Analyze"
            component={AnalyzeScreen}
            options={{
              tabBarIcon: ({ color, focused }) => (
                <View className="items-center">
                  {focused && (
                    <View className="absolute -top-[12px] h-[3px] w-5 rounded-full bg-primary-500" />
                  )}
                  <BarChart3
                    stroke={color}
                    size={TAB_ICON_SIZE}
                    strokeWidth={TAB_ICON_STROKE_WIDTH}
                  />
                </View>
              ),
            }}
          />
        </>
      ) : null}

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              {focused && (
                <View className="absolute -top-[12px] h-[3px] w-5 rounded-full bg-primary-500" />
              )}
              <UserIcon stroke={color} size={TAB_ICON_SIZE} strokeWidth={TAB_ICON_STROKE_WIDTH} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
