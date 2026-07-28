/**
 * Notification and Device Token models matching backend specification.
 */

export interface IDeviceTokenRequest {
  token: string;
  device_type: "android" | "ios" | "web";
  app_version?: string;
}

export interface INotificationData {
  familyId?: string;
  itemId?: string;
  action?: string;
  [key: string]: unknown;
}

export interface INotificationItem {
  id: string;
  familyId: string;
  recipientUid: string;
  actorUid: string;
  actorName: string;
  title: string;
  body: string;
  type: string;
  data?: INotificationData;
  isRead: boolean;
  createdAt: string;
}

export interface INotificationFeedResponse {
  unreadCount: number;
  items: INotificationItem[];
}

export interface IUnreadCountResponse {
  unreadCount: number;
}
