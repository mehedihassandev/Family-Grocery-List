import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, ShoppingBasket, Users, User as UserIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DashboardScreen from "../screens/DashboardScreen";
import HomeScreen from "../screens/HomeScreen";
import MembersScreen from "../screens/MembersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  BottomTabNavigatorParamList,
  HomeStackParamList,
  ListStackParamList,
  MembersStackParamList,
  ProfileStackParamList,
} from "../types";
import { View } from "react-native";
import { syncFamilyInviteForOwner } from "../services/family";

const Tab = createBottomTabNavigator<BottomTabNavigatorParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ListStack = createNativeStackNavigator<ListStackParamList>();
const MembersStack = createNativeStackNavigator<MembersStackParamList>();
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

const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

const TAB_ICON_SIZE = 22;
const TAB_ICON_STROKE_WIDTH = 2.5;

const TabIcon = ({
  focused,
  color,
  Icon,
}: {
  focused: boolean;
  color: string;
  Icon: React.ElementType;
}) => {
  return (
    <View
      className={
        "items-center justify-center rounded-2xl " + (focused ? "bg-primary-50 px-5 py-1.5" : "")
      }
    >
      <Icon stroke={color} size={TAB_ICON_SIZE} strokeWidth={TAB_ICON_STROKE_WIDTH} />
    </View>
  );
};

/**
 * Main bottom tab navigator
 * Why: To provide easy access to the core features of the application.
 */
const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(insets.bottom, 10);
  const { user, loading, hasHydrated, profileSynced } = useAuthStore();
  const initNotifications = useNotificationStore((state) => state.init);
  const clearNotifications = useNotificationStore((state) => state.clear);
  const authReady = hasHydrated && !loading;
  const familyId = authReady && profileSynced ? user?.familyId : null;

  useEffect(() => {
    if (familyId) {
      initNotifications(familyId);
    } else {
      clearNotifications();
    }
    return () => clearNotifications();
  }, [clearNotifications, familyId, initNotifications]);

  useEffect(() => {
    if (!authReady || !profileSynced || !user?.uid || !familyId || user.role !== "owner") {
      return;
    }
    void syncFamilyInviteForOwner(familyId, user.uid).catch((error) => {
      if (__DEV__) {
        console.warn("Owner invite sync failed:", error);
      }
    });
  }, [authReady, familyId, profileSynced, user?.role, user?.uid]);

  return (
    <Tab.Navigator
      key={familyId ? "family-tabs" : "no-family-tabs"}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#10B981",
        tabBarInactiveTintColor: "#9AA3AF",
        tabBarShowLabel: true,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FFFFFF",
          height: 64 + tabBarPaddingBottom,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: "#E8EBF0",
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} color={color} Icon={Home} />
          ),
        }}
      />

      {familyId ? (
        <>
          <Tab.Screen
            name="ListStack"
            component={ListStackScreen}
            options={{
              title: "Groceries",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon focused={focused} color={color} Icon={ShoppingBasket} />
              ),
            }}
          />
          <Tab.Screen
            name="MembersStack"
            component={MembersStackScreen}
            options={{
              title: "Family",
              tabBarIcon: ({ color, focused }) => (
                <TabIcon focused={focused} color={color} Icon={Users} />
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
            <TabIcon focused={focused} color={color} Icon={UserIcon} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
