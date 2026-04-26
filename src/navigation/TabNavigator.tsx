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
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  BottomTabNavigatorParamList,
  HomeStackParamList,
  ListStackParamList,
  MembersStackParamList,
  AnalyzeStackParamList,
  ProfileStackParamList,
} from "../types";
import { View } from "react-native";

const Tab = createBottomTabNavigator<BottomTabNavigatorParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ListStack = createNativeStackNavigator<ListStackParamList>();
const MembersStack = createNativeStackNavigator<MembersStackParamList>();
const AnalyzeStack = createNativeStackNavigator<AnalyzeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const HomeStackScreen = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Home" component={DashboardScreen} />
  </HomeStack.Navigator>
);

const ListStackScreen = () => (
  <ListStack.Navigator screenOptions={{ headerShown: false }}>
    <ListStack.Screen name="List" component={HomeScreen} />
  </ListStack.Navigator>
);

const MembersStackScreen = () => (
  <MembersStack.Navigator screenOptions={{ headerShown: false }}>
    <MembersStack.Screen name="Members" component={MembersScreen} />
  </MembersStack.Navigator>
);

const AnalyzeStackScreen = () => (
  <AnalyzeStack.Navigator screenOptions={{ headerShown: false }}>
    <AnalyzeStack.Screen name="Analyze" component={AnalyzeScreen} />
  </AnalyzeStack.Navigator>
);

const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

const TAB_ICON_SIZE = 20;
const TAB_ICON_STROKE_WIDTH = 2.5;

/**
 * Main bottom tab navigator
 * Why: To provide easy access to the core features of the application.
 */
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

    // Cleanup on unmount to prevent persistent listeners after logout
    return () => clearNotifications();
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
        name="HomeStack"
        component={HomeStackScreen}
        options={{
          title: "Home",
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
            name="ListStack"
            component={ListStackScreen}
            options={{
              title: "List",
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
            name="MembersStack"
            component={MembersStackScreen}
            options={{
              title: "Members",
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
            name="AnalyzeStack"
            component={AnalyzeStackScreen}
            options={{
              title: "Analyze",
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
        name="ProfileStack"
        component={ProfileStackScreen}
        options={{
          title: "Profile",
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
