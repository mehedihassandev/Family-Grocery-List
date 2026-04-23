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

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(insets.bottom, 10);
  const { user } = useAuthStore();
  const initNotifications = useNotificationStore((state) => state.init);
  const clearNotifications = useNotificationStore((state) => state.clear);

  useEffect(() => {
    if (user?.familyId) {
      initNotifications(user.familyId);
    } else {
      clearNotifications();
    }
  }, [user?.familyId]);

  return (
    <Tab.Navigator
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
          height: 60 + tabBarPaddingBottom,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 7,
          borderTopWidth: 1,
          shadowColor: "#4f5f56",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 5,
          borderColor: "rgba(184, 198, 189, 0.35)",
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: "600",
          marginTop: -3,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color }) => <Home stroke={color} size={20} strokeWidth={2.5} />,
        }}
      />
      <Tab.Screen
        name="List"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <ShoppingBasket stroke={color} size={20} strokeWidth={2.5} />,
        }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{
          tabBarIcon: ({ color }) => <Users stroke={color} size={20} strokeWidth={2.5} />,
        }}
      />
      <Tab.Screen
        name="Analyze"
        component={AnalyzeScreen}
        options={{
          tabBarIcon: ({ color }) => <BarChart3 stroke={color} size={20} strokeWidth={2.5} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <UserIcon stroke={color} size={20} strokeWidth={2.5} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
