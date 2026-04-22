import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Users, User as UserIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeScreen from "../screens/HomeScreen";
import MembersScreen from "../screens/MembersScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    const insets = useSafeAreaInsets();
    const tabBarPaddingBottom = Math.max(insets.bottom, 10);

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
                    height: 32 + tabBarPaddingBottom,
                    paddingBottom: tabBarPaddingBottom,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    shadowColor: "#4f5f56",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.1,
                    shadowRadius: 16,
                    elevation: 5,
                    borderColor: "rgba(184, 198, 189, 0.35)",
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "700",
                    marginTop: -3,
                },
            }}
        >
            <Tab.Screen
                name="List"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Home stroke={color} size={22} strokeWidth={2.5} />
                    ),
                }}
            />
            <Tab.Screen
                name="Members"
                component={MembersScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Users stroke={color} size={22} strokeWidth={2.5} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <UserIcon stroke={color} size={22} strokeWidth={2.5} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
