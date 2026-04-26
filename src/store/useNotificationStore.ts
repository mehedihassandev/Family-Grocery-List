import { create } from "zustand";
import { IAppNotification } from "../types";
import { subscribeToNotifications } from "../services/notification";

interface INotificationState {
  notifications: IAppNotification[];
  loading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;
  init: (familyId: string) => void;
  clear: () => void;
}

/**
 * Notification state store
 * Why: To manage real-time notification subscriptions and data.
 */
export const useNotificationStore = create<INotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  unsubscribe: null,

  init: (familyId: string) => {
    const { unsubscribe, clear } = get();
    // Clear any existing subscription if init is called again.
    if (unsubscribe) {
      unsubscribe();
    }
    clear();

    if (!familyId) return;

    set({ loading: true, error: null });

    const newUnsubscribe = subscribeToNotifications(
      familyId,
      (notifications) => {
        set({ notifications, loading: false });
      },
      (error) => {
        set({ error: error.message, loading: false });
      },
    );

    set({ unsubscribe: newUnsubscribe });
  },

  clear: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
    }
    set({ notifications: [], loading: false, error: null, unsubscribe: null });
  },
}));
