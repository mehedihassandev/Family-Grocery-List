import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../constants/query-keys";
import {
  getFamilyNotificationsApi,
  getUnreadNotificationCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  registerDeviceTokenApi,
  removeDeviceTokenApi,
} from "../../services/api/notification";
import {
  IDeviceTokenRequest,
  INotificationFeedResponse,
  IUnreadCountResponse,
} from "../../models/notification";
import { useAuthStore } from "../../store/useAuthStore";

/**
 * Fetch notification list feed for a family
 */
export const useNotificationsQuery = (familyId?: string | null, limit: number = 50) => {
  const { hasHydrated, loading, user } = useAuthStore();
  const canFetch = Boolean(familyId && hasHydrated && !loading && user?.uid);

  return useQuery<INotificationFeedResponse>({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, familyId, limit],
    queryFn: async () => {
      if (!familyId) return { unreadCount: 0, items: [] };
      return getFamilyNotificationsApi(familyId, limit);
    },
    enabled: canFetch,
    refetchInterval: 15 * 1000, // Poll every 15s to keep feed fresh alongside push
    staleTime: 5 * 1000,
  });
};

/**
 * Fetch unread notification count for badge display
 */
export const useUnreadNotificationCountQuery = (familyId?: string | null) => {
  const { hasHydrated, loading, user } = useAuthStore();
  const canFetch = Boolean(familyId && hasHydrated && !loading && user?.uid);

  return useQuery<IUnreadCountResponse>({
    queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT, familyId],
    queryFn: async () => {
      if (!familyId) return { unreadCount: 0 };
      return getUnreadNotificationCountApi(familyId);
    },
    enabled: canFetch,
    refetchInterval: 15 * 1000,
    staleTime: 5 * 1000,
  });
};

/**
 * Mutation to mark a single notification as read
 */
export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, notificationId }: { familyId: string; notificationId: string }) =>
      markNotificationReadApi(familyId, notificationId),
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS, familyId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT, familyId] });
    },
  });
};

/**
 * Mutation to mark all notifications as read
 */
export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (familyId: string) => markAllNotificationsReadApi(familyId),
    onSuccess: (_, familyId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS, familyId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT, familyId] });
    },
  });
};

/**
 * Mutation to register device FCM token
 */
export const useRegisterDeviceTokenMutation = () => {
  return useMutation({
    mutationFn: (payload: IDeviceTokenRequest) => registerDeviceTokenApi(payload),
  });
};

/**
 * Mutation to remove device FCM token on logout
 */
export const useRemoveDeviceTokenMutation = () => {
  return useMutation({
    mutationFn: (token: string) => removeDeviceTokenApi(token),
  });
};
