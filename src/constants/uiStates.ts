export const UI_STATES = ["loading", "empty", "error", "success"] as const;

export type UIState = (typeof UI_STATES)[number];

export type AsyncState<T> = {
  status: UIState;
  data: T | null;
  error: string | null;
};

export const createInitialAsyncState = <T>(): AsyncState<T> => ({
  status: "loading",
  data: null,
  error: null,
});
