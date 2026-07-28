import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "../store/useAuthStore";
import { RootNavigatorParamList } from "../types";
import { pushNotificationService } from "../services/pushNotificationService";

import AuthenticatedNavigator from "./AuthenticatedNavigator";
import UnAuthenticatedNavigator from "./UnAuthenticatedNavigator";

const Stack = createNativeStackNavigator<RootNavigatorParamList>();

/**
 * Root Centralized Navigator Component
 * Why: Serves as the root stack navigator for authentication state switching.
 * Fix: Subscribes only to primitive userId to prevent unnecessary re-rendering of NavigationContainer when user object mutates.
 */
const Navigator = () => {
  const userId = useAuthStore((state) => state.user?.uid);
  const familyId = useAuthStore((state) => state.user?.familyId);
  const isAuthenticated = !!userId;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (userId) {
      // Pass queryClient + familyId so the service can invalidate the notification
      // badge and feed cache immediately when a foreground push arrives.
      void pushNotificationService.initialize(
        (data) => {
          if (data.itemId) {
            // TODO: handle deep linking here via standard navigation
          }
        },
        queryClient,
        familyId,
      );
    } else {
      void pushNotificationService.unregisterToken();
    }

    return () => {
      pushNotificationService.cleanup();
    };
  }, [userId, familyId, queryClient]);

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="UnAuthenticatedStack" component={UnAuthenticatedNavigator} />
        ) : (
          <Stack.Screen name="AuthenticatedStack" component={AuthenticatedNavigator} />
        )}
      </Stack.Navigator>
    </>
  );
};

export default Navigator;
