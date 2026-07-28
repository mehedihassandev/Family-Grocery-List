import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../../constants/query-keys";
import {
  fetchSuperstoreComparison,
  calculateBasketOptimization,
  calculateBasketSplitOptimization,
  fetchPriceAlerts,
  createPriceAlert,
  checkPriceAlerts,
  deletePriceAlert,
} from "../../services/superstore";
import { IGroceryItem } from "../../models/grocery";
import { ICreatePriceAlertPayload } from "../../types/superstore";

/**
 * TanStack Query Hook for fetching superstore marketplace price comparison
 * Compares Shwapno, Meena Bazar, and Agora
 */
export function useSuperstoreComparison(itemName?: string, unit?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.SUPERSTORE_COMPARISON, itemName, unit],
    queryFn: () => fetchSuperstoreComparison(itemName!, unit),
    enabled: !!itemName && itemName.trim().length > 0,
    staleTime: 1000 * 60 * 15, // 15 minutes cache
  });
}

/**
 * TanStack Query Hook for total basket cost optimization across Shwapno, Meena Bazar, and Agora
 */
export function useBasketOptimization(familyId?: string, items: IGroceryItem[] = []) {
  return useQuery({
    queryKey: [QUERY_KEYS.BASKET_OPTIMIZATION, familyId, items.length],
    queryFn: () => calculateBasketOptimization(items, familyId || "default"),
    enabled: !!familyId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * TanStack Query Hook for multi-store basket split optimization strategy
 */
export function useBasketSplitOptimization(familyId?: string, items: IGroceryItem[] = []) {
  return useQuery({
    queryKey: [QUERY_KEYS.BASKET_SPLIT_OPTIMIZATION, familyId, items.length],
    queryFn: () => calculateBasketSplitOptimization(items, familyId || "default"),
    enabled: !!familyId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * TanStack Query Hook for fetching active family price alerts
 */
export function usePriceAlerts(familyId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRICE_ALERTS, familyId],
    queryFn: () => fetchPriceAlerts(familyId!),
    enabled: !!familyId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * TanStack Mutation Hook to create a price drop alert
 */
export function useCreatePriceAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ICreatePriceAlertPayload) => createPriceAlert(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRICE_ALERTS, variables.familyId] });
    },
  });
}

/**
 * TanStack Mutation Hook to trigger live market price check on active alerts
 */
export function useCheckPriceAlerts(familyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => checkPriceAlerts(),
    onSuccess: () => {
      if (familyId) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRICE_ALERTS, familyId] });
      }
    },
  });
}

/**
 * TanStack Mutation Hook to delete a price alert
 */
export function useDeletePriceAlert(familyId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => deletePriceAlert(alertId),
    onSuccess: () => {
      if (familyId) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PRICE_ALERTS, familyId] });
      }
    },
  });
}
