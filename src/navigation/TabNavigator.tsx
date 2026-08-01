import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutGrid, ShoppingBag, BarChart3, Users, User as UserIcon } from "lucide-react-native";
import * as Haptics from "expo-haptics";

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

/**
 * Custom Floating Dock Tab Bar matching Stitch design reference.
 * Active tab floats upward in a prominent circular green badge with ring border.
 */
const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useAppTheme();
  const paddingBottom = Math.max(insets.bottom, 8);

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          paddingBottom,
          height: 58 + paddingBottom,
          backgroundColor: isDark ? "rgba(11, 28, 48, 0.96)" : "rgba(255, 255, 255, 0.96)",
          borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const getIcon = (focused: boolean) => {
          const color = focused ? "#FFFFFF" : colors.icon;
          const strokeWidth = focused ? 2.5 : 2;
          const size = focused ? 22 : 20;

          switch (route.name) {
            case ROUTES.DASHBOARD:
              return <LayoutGrid stroke={color} size={size} strokeWidth={strokeWidth} />;
            case ROUTES.GROCERIES:
              return <ShoppingBag stroke={color} size={size} strokeWidth={strokeWidth} />;
            case ROUTES.ANALYTICS:
              return <BarChart3 stroke={color} size={size} strokeWidth={strokeWidth} />;
            case ROUTES.FAMILY:
              return <Users stroke={color} size={size} strokeWidth={strokeWidth} />;
            case ROUTES.PROFILE:
              return <UserIcon stroke={color} size={size} strokeWidth={strokeWidth} />;
            default:
              return <LayoutGrid stroke={color} size={size} strokeWidth={strokeWidth} />;
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : { selected: false }}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            activeOpacity={0.8}
            style={styles.tabItem}
          >
            {isFocused ? (
              <View
                style={[
                  styles.raisedCircle,
                  {
                    backgroundColor: colors.accent,
                    borderColor: colors.bgCanvas,
                    shadowColor: colors.accent,
                  },
                ]}
              >
                {getIcon(true)}
              </View>
            ) : (
              <View style={styles.iconWrapper}>{getIcon(false)}</View>
            )}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? colors.accent : colors.textMuted,
                  fontWeight: isFocused ? "800" : "600",
                  marginTop: isFocused ? 22 : 3,
                },
              ]}
            >
              {typeof label === "string" ? label : route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const TabNavigator: React.FC = () => {
  const { colors } = useAppTheme();
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
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bgCanvas },
      }}
    >
      <Tab.Screen
        name={ROUTES.DASHBOARD}
        component={DashboardScreen as any}
        options={{ tabBarLabel: "Dashboard" }}
      />
      <Tab.Screen
        name={ROUTES.GROCERIES}
        component={GroceryListScreen as any}
        options={{ tabBarLabel: "Grocery" }}
      />
      <Tab.Screen
        name={ROUTES.ANALYTICS}
        component={AnalyticsScreen as any}
        options={{ tabBarLabel: "Analytics" }}
      />
      <Tab.Screen
        name={ROUTES.FAMILY}
        component={FamilyScreen as any}
        options={{ tabBarLabel: "Family" }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE}
        component={ProfileScreen as any}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    elevation: 15,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: "visible",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    position: "relative",
  },
  raisedCircle: {
    position: "absolute",
    top: -18,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.2,
  },
});

export default TabNavigator;
