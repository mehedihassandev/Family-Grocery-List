import React from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useLoadingStore } from "../../store/useLoadingStore";
import LoadingOverlay from "./LoadingOverlay";

/**
 * Global Loading Overlay
 * Why: Listens to active TanStack Query mutations, initial un-cached queries, and Zustand loading store.
 * Fixes background refetch popups by ignoring silent background revalidations (when cached data is present),
 * ensuring the loader overlay shows ONLY for active mutations, initial un-cached screen loads, or explicit triggers.
 */
export const GlobalLoadingOverlay = () => {
  // Only trigger full-screen loader for initial pending queries with no existing cached data
  const pendingInitialFetches = useIsFetching({
    predicate: (query) => query.state.status === "pending" && query.state.data === undefined,
  });

  const isMutating = useIsMutating();
  const isStoreLoading = useLoadingStore((state) => state.isLoading);

  const isLoading = pendingInitialFetches > 0 || isMutating > 0 || isStoreLoading;

  return <LoadingOverlay visible={isLoading} />;
};

export default GlobalLoadingOverlay;
