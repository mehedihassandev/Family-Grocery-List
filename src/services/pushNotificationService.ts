import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { QueryClient } from "@tanstack/react-query";
import { registerDeviceTokenApi, removeDeviceTokenApi } from "./api/notification";
import { IDeviceTokenRequest } from "../types";
import { QUERY_KEYS } from "../constants/query-keys";

const TOKEN_STORAGE_KEY = "@family_grocery_fcm_token";

let notificationListener: (() => void) | null = null;
let responseListener: (() => void) | null = null;
let foregroundListener: (() => void) | null = null;

export type TDeepLinkCallback = (data: {
  familyId?: string;
  itemId?: string;
  type?: string;
}) => void;

/** Backend push data payload shape */
interface IBackendPushData {
  type?: "ITEM_ADDED" | "ITEM_COMPLETED" | "ITEM_UPDATED" | "MEMBER_JOINED" | string;
  familyId?: string;
  itemId?: string;
  actorUid?: string;
  actorName?: string;
}

interface INotificationResponse {
  notification: {
    request: {
      content: {
        data?: Record<string, unknown>;
      };
    };
  };
}

class PushNotificationService {
  private activeToken: string | null = null;
  private queryClient: QueryClient | null = null;
  private familyId: string | null = null;

  /**
   * Initialize push notification permissions, token registration, and listeners.
   * @param onDeepLink - Callback fired when user taps a notification
   * @param queryClient - TanStack QueryClient for cache invalidation on foreground push
   * @param familyId - Current user's family ID for targeted cache invalidation
   */
  async initialize(
    onDeepLink?: TDeepLinkCallback,
    queryClient?: QueryClient,
    familyId?: string | null,
  ): Promise<void> {
    try {
      this.queryClient = queryClient ?? null;
      this.familyId = familyId ?? null;

      // Dynamic import of expo-notifications to support environments where it is optional
      let Notifications: any = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional dynamic import
        Notifications = require("expo-notifications");
      } catch {
        // Module optional or unavailable in current environment
        return;
      }

      if (!Notifications) return;

      // Configure foreground handler — show alert + sound + badge while app is open
      if (typeof Notifications.setNotificationHandler === "function") {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
      }

      // Request notification permissions
      if (typeof Notifications.getPermissionsAsync === "function") {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (
          existingStatus !== "granted" &&
          typeof Notifications.requestPermissionsAsync === "function"
        ) {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          if (__DEV__) {
            console.log("[PushNotificationService] Notification permission not granted");
          }
          return;
        }
      }

      // Fetch Push Token — try Expo token first (works on simulators + Expo Go),
      // then fall back to native device token for standalone builds.
      let token: string | null = null;

      if (__DEV__) {
        console.log("[PushNotificationService] 🔍 Attempting to fetch push token...");
      }

      // Try to get EAS projectId dynamically
      let projectId: string | undefined;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional dynamic import
        const Constants = require("expo-constants").default;
        projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      } catch {
        // expo-constants is unavailable
      }

      // Step 1: Try Expo Push Token (works on simulator with Expo Go)
      if (typeof Notifications.getExpoPushTokenAsync === "function") {
        try {
          const expoTokenData = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined,
          );
          token = expoTokenData?.data || null;
          if (__DEV__ && token) {
            console.log("\n🔔 ======================== EXPO PUSH TOKEN ========================");
            console.log("🔔 Expo Push Token:", token);
            console.log("🔔 Copy this token → https://expo.dev/notifications");
            console.log("🔔 ==================================================================\n");
          }
        } catch (expoErr) {
          if (__DEV__) {
            const errMessage = expoErr instanceof Error ? expoErr.message : String(expoErr);
            const isMissingProjectId = errMessage.includes("projectId");
            if (isMissingProjectId) {
              console.log(
                "[PushNotificationService] ℹ️ getExpoPushTokenAsync skipped: No projectId configured (expected in bare dev/simulator).",
              );
            } else {
              console.warn("[PushNotificationService] ⚠️ getExpoPushTokenAsync failed:", expoErr);
            }
          }
        }
      }

      // Step 2: If no Expo token, try native Device Push Token (works on real devices)
      if (!token && typeof Notifications.getDevicePushTokenAsync === "function") {
        try {
          const tokenData = await Notifications.getDevicePushTokenAsync();
          token = tokenData?.data || null;
          if (__DEV__ && token) {
            console.log("\n🔔 ======================== DEVICE PUSH TOKEN ========================");
            console.log("🔔 Device Push Token:", token);
            console.log(
              "🔔 =====================================================================\n",
            );
          }
        } catch (deviceErr) {
          if (__DEV__) {
            console.warn(
              "[PushNotificationService] ⚠️ getDevicePushTokenAsync failed (expected on iOS Simulator):",
              deviceErr,
            );
          }
        }
      }

      if (!token && __DEV__) {
        console.warn(
          "[PushNotificationService] ❌ No push token obtained.\n" +
            "  → On iOS Simulator: use a real device OR Expo Go app.\n" +
            "  → On Android Emulator: ensure Google Play Services is available.",
        );
      }

      if (token) {
        await this.registerToken(token);
      }

      // ─── Foreground Push Handler ───────────────────────────────────────────
      // When the app is open and a push arrives, invalidate the notification
      // query cache so the badge and feed refresh immediately without waiting
      // for the next 15-second poll.
      if (typeof Notifications.addNotificationReceivedListener === "function") {
        // Clean up any previous listener
        if (foregroundListener) {
          foregroundListener();
          foregroundListener = null;
        }

        const fgSubscription = Notifications.addNotificationReceivedListener(
          (notification: { request: { content: { data?: Record<string, unknown> } } }) => {
            const data = notification?.request?.content?.data as IBackendPushData | undefined;

            if (__DEV__) {
              console.log(
                "[PushNotificationService] 📩 Foreground push received:",
                data?.type ?? "unknown",
              );
            }

            this.invalidateNotificationCache(data?.familyId);

            // For item-related events, also refresh the grocery list
            if (
              data?.type === "ITEM_ADDED" ||
              data?.type === "ITEM_COMPLETED" ||
              data?.type === "ITEM_UPDATED"
            ) {
              this.invalidateGroceryCache(data?.familyId);
            }
          },
        );

        foregroundListener = () => {
          if (fgSubscription && typeof fgSubscription.remove === "function") {
            fgSubscription.remove();
          }
        };
      }

      // ─── Notification Tap Handler (Deep Link) ─────────────────────────────
      if (onDeepLink) {
        // Handle notification the app was launched from (cold start)
        if (typeof Notifications.getLastNotificationResponseAsync === "function") {
          const lastResponse: INotificationResponse | null =
            await Notifications.getLastNotificationResponseAsync();
          if (lastResponse?.notification?.request?.content?.data) {
            const data = lastResponse.notification.request.content.data as IBackendPushData;
            if (data.itemId || data.familyId) {
              onDeepLink({ familyId: data.familyId, itemId: data.itemId, type: data.type });
            }
          }
        }

        // Handle notification tap while app is in foreground or background
        if (typeof Notifications.addNotificationResponseReceivedListener === "function") {
          const subscription = Notifications.addNotificationResponseReceivedListener(
            (response: INotificationResponse) => {
              const data = response?.notification?.request?.content?.data as IBackendPushData;
              if (data?.itemId || data?.familyId) {
                onDeepLink({ familyId: data.familyId, itemId: data.itemId, type: data.type });
              }
              // Also refresh cache on tap (ensures badge clears after marking read)
              this.invalidateNotificationCache(data?.familyId);
            },
          );
          responseListener = () => {
            if (subscription && typeof subscription.remove === "function") {
              subscription.remove();
            }
          };
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn("[PushNotificationService] Initialization error:", error);
      }
    }
  }

  /**
   * Update the familyId after login/family join so the cache invalidation
   * targets the correct family without reinitializing the service.
   */
  updateFamilyId(familyId: string | null): void {
    this.familyId = familyId;
  }

  /**
   * Invalidate the notification query cache for a given or stored familyId.
   * This triggers an immediate refetch of the badge count and notification feed.
   */
  private invalidateNotificationCache(familyId?: string): void {
    if (!this.queryClient) return;
    const fid = familyId || this.familyId;
    if (!fid) return;

    void this.queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS, fid] });
    void this.queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT, fid],
    });
  }

  /**
   * Invalidate the grocery items cache so the list refreshes when item events arrive.
   */
  private invalidateGroceryCache(familyId?: string): void {
    if (!this.queryClient) return;
    const fid = familyId || this.familyId;
    if (!fid) return;

    void this.queryClient.invalidateQueries({ queryKey: ["dataGroceryItems", fid] });
  }

  /**
   * Register push token with backend API
   */
  async registerToken(token: string): Promise<void> {
    if (!token) return;
    try {
      this.activeToken = token;
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);

      const deviceType =
        Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
      const payload: IDeviceTokenRequest = {
        token,
        device_type: deviceType,
        app_version: "1.0.0",
      };

      await registerDeviceTokenApi(payload);
      if (__DEV__) {
        console.log("[PushNotificationService] Device token registered successfully");
      }
    } catch (error) {
      if (__DEV__) {
        console.warn("[PushNotificationService] Register token failed:", error);
      }
    }
  }

  /**
   * Unregister token on logout — backend removes it so no more pushes arrive after sign-out.
   */
  async unregisterToken(): Promise<void> {
    try {
      const storedToken = this.activeToken || (await AsyncStorage.getItem(TOKEN_STORAGE_KEY));
      if (storedToken) {
        await removeDeviceTokenApi(storedToken);
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        this.activeToken = null;
        if (__DEV__) {
          console.log("[PushNotificationService] Device token removed successfully");
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.warn("[PushNotificationService] Remove token error:", error);
      }
    }
  }

  /**
   * Clean up all notification listeners
   */
  cleanup(): void {
    if (notificationListener) {
      notificationListener();
      notificationListener = null;
    }
    if (responseListener) {
      responseListener();
      responseListener = null;
    }
    if (foregroundListener) {
      foregroundListener();
      foregroundListener = null;
    }
    this.queryClient = null;
    this.familyId = null;
  }
}

export const pushNotificationService = new PushNotificationService();
