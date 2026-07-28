import { apiClient } from "./config";
import { API_ENDPOINTS } from "./endpoints";
import {
  IDeviceTokenRequest,
  INotificationFeedResponse,
  IUnreadCountResponse,
} from "../../models/notification";

/**
 * Register FCM device token for current user
 */
export const registerDeviceTokenApi = async (
  payload: IDeviceTokenRequest,
): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(
    API_ENDPOINTS.deviceTokens.register,
    payload,
  );
  return response.data;
};

/**
 * Remove device token on user logout
 */
export const removeDeviceTokenApi = async (token: string): Promise<{ message: string }> => {
  if (!token) return { message: "No token provided." };
  const response = await apiClient.delete<{ message: string }>(
    API_ENDPOINTS.deviceTokens.remove(token),
  );
  return response.data;
};

/**
 * Get notification feed for family
 */
export const getFamilyNotificationsApi = async (
  familyId: string,
  limit: number = 50,
): Promise<INotificationFeedResponse> => {
  if (!familyId) {
    throw new Error("Family ID is required to fetch notifications.");
  }
  const response = await apiClient.get<INotificationFeedResponse>(
    API_ENDPOINTS.notifications.list(familyId),
    {
      params: { limit },
    },
  );
  return response.data;
};

/**
 * Get unread notification count for family
 */
export const getUnreadNotificationCountApi = async (
  familyId: string,
): Promise<IUnreadCountResponse> => {
  if (!familyId) {
    return { unreadCount: 0 };
  }
  const response = await apiClient.get<IUnreadCountResponse>(
    API_ENDPOINTS.notifications.unreadCount(familyId),
  );
  return response.data;
};

/**
 * Mark a single notification as read
 */
export const markNotificationReadApi = async (
  familyId: string,
  notificationId: string,
): Promise<{ message: string }> => {
  if (!familyId || !notificationId) {
    throw new Error("Family ID and Notification ID are required.");
  }
  const response = await apiClient.patch<{ message: string }>(
    API_ENDPOINTS.notifications.markRead(familyId, notificationId),
  );
  return response.data;
};

/**
 * Mark all notifications in a family as read
 */
export const markAllNotificationsReadApi = async (
  familyId: string,
): Promise<{ message: string }> => {
  if (!familyId) {
    throw new Error("Family ID is required.");
  }
  const response = await apiClient.post<{ message: string }>(
    API_ENDPOINTS.notifications.markAllRead(familyId),
  );
  return response.data;
};
