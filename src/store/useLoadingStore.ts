import { create } from "zustand";

interface ILoadingState {
  isLoading: boolean;
  activeKeys: Set<string>;
  showLoading: (key?: string) => void;
  hideLoading: (key?: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Global loading store for tracking async operations and API states imperative trigger
 */
export const useLoadingStore = create<ILoadingState>((set) => ({
  isLoading: false,
  activeKeys: new Set<string>(),
  showLoading: (key = "default") =>
    set((state) => {
      const nextKeys = new Set(state.activeKeys);
      nextKeys.add(key);
      return { activeKeys: nextKeys, isLoading: nextKeys.size > 0 };
    }),
  hideLoading: (key = "default") =>
    set((state) => {
      const nextKeys = new Set(state.activeKeys);
      nextKeys.delete(key);
      return { activeKeys: nextKeys, isLoading: nextKeys.size > 0 };
    }),
  setLoading: (loading) =>
    set(() => ({
      isLoading: loading,
      activeKeys: loading ? new Set(["manual"]) : new Set(),
    })),
}));
