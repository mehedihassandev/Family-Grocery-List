import { QueryClient } from "@tanstack/react-query";

/**
 * Global TanStack Query Client configuration
 * Why: Centralized management of query caching, retries, and stale times.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data remains fresh for 1 minute before background refetching
      staleTime: 1000 * 60,
      // Retries failed queries twice
      retry: 2,
      // Prevents automatic refetch on window focus (often annoying in mobile)
      refetchOnWindowFocus: false,
    },
  },
});
