import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IUser } from "../types";

interface IAuthState {
  user: IUser | null;
  loading: boolean;
  hasHydrated: boolean;
  setUser: (user: IUser | null) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

/**
 * Authentication state store
 * Why: To manage user session and hydration state across the app.
 */
export const useAuthStore = create<IAuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "auth-session-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state, error) => {
        if (__DEV__ && error) {
          console.warn("Auth store rehydrate failed:", error);
        }

        state?.setHasHydrated(true);
      },
    },
  ),
);
