import React from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useLoadingStore } from "../../store/useLoadingStore";
import LoadingOverlay from "./LoadingOverlay";

/**
 * Global Loading Overlay
 * Why: Automatically listens to active TanStack Query fetches/mutations and Zustand loading store,
 * displaying the clean app-logo loader overlay everywhere across all screens when API calls or async actions are active.
 */
export const GlobalLoadingOverlay = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isStoreLoading = useLoadingStore((state) => state.isLoading);

  const isLoading = isFetching > 0 || isMutating > 0 || isStoreLoading;

  return <LoadingOverlay visible={isLoading} />;
};

export default GlobalLoadingOverlay;
