import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addGroceryItemApi,
  getFamilyGroceryItemsApi,
  getFamilyGrocerySummaryApi,
  getGroceryItemDetailApi,
  modifyGroceryItemApi,
  removeGroceryItemApi,
  seedGroceryItemsApi,
} from "../services/api/grocery";
import {
  ICreateGroceryItemRequest,
  IDataGrocerySummary,
  IGroceryItem,
  IUpdateGroceryItemRequest,
} from "../models/grocery";

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const GROCERY_SUMMARY_QUERY_KEY = "dataGrocerySummary" as const;
export const GROCERY_ITEMS_QUERY_KEY = "dataGroceryItems" as const;
export const GROCERY_ITEM_DETAIL_QUERY_KEY = "groceryItem" as const;

// ─── Query & Mutation Hooks ──────────────────────────────────────────────────
export const useFamilyGrocerySummary = (familyId?: string | null) =>
  useQuery<IDataGrocerySummary>({
    queryKey: [GROCERY_SUMMARY_QUERY_KEY, familyId],
    queryFn: () => getFamilyGrocerySummaryApi(familyId ?? ""),
    enabled: Boolean(familyId),
    staleTime: 60 * 1000,
  });

export const useFamilyGroceryItemsBackend = (familyId?: string | null) =>
  useQuery<IGroceryItem[]>({
    queryKey: [GROCERY_ITEMS_QUERY_KEY, familyId],
    queryFn: () => getFamilyGroceryItemsApi(familyId ?? ""),
    enabled: Boolean(familyId),
    staleTime: 30 * 1000,
  });

export const useGroceryItemBackend = (familyId?: string | null, itemId?: string | null) =>
  useQuery<IGroceryItem | null>({
    queryKey: [GROCERY_ITEM_DETAIL_QUERY_KEY, itemId],
    queryFn: async () => {
      if (!familyId || !itemId) return null;
      return getGroceryItemDetailApi(familyId, itemId);
    },
    enabled: Boolean(familyId && itemId),
  });

export const useAddGroceryItemBackend = (familyId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ICreateGroceryItemRequest & Record<string, unknown>) =>
      addGroceryItemApi(familyId ?? "", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GROCERY_ITEMS_QUERY_KEY, familyId] });
      queryClient.invalidateQueries({ queryKey: [GROCERY_SUMMARY_QUERY_KEY, familyId] });
    },
  });
};

export const useUpdateGroceryItemBackend = (familyId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: IUpdateGroceryItemRequest & Record<string, unknown>;
    }) => modifyGroceryItemApi(familyId ?? "", itemId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [GROCERY_ITEM_DETAIL_QUERY_KEY, variables.itemId],
      });
      queryClient.invalidateQueries({ queryKey: [GROCERY_ITEMS_QUERY_KEY, familyId] });
      queryClient.invalidateQueries({ queryKey: [GROCERY_SUMMARY_QUERY_KEY, familyId] });
    },
  });
};

export const useToggleItemCompletionBackend = (familyId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      currentStatus,
    }: {
      itemId: string;
      currentStatus: "pending" | "completed";
    }) =>
      modifyGroceryItemApi(familyId ?? "", itemId, {
        status: currentStatus === "pending" ? "completed" : "pending",
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [GROCERY_ITEM_DETAIL_QUERY_KEY, variables.itemId],
      });
      queryClient.invalidateQueries({ queryKey: [GROCERY_ITEMS_QUERY_KEY, familyId] });
      queryClient.invalidateQueries({ queryKey: [GROCERY_SUMMARY_QUERY_KEY, familyId] });
    },
  });
};

export const useDeleteGroceryItemBackend = (familyId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => removeGroceryItemApi(familyId ?? "", itemId),
    onSuccess: (_, itemId) => {
      queryClient.removeQueries({ queryKey: [GROCERY_ITEM_DETAIL_QUERY_KEY, itemId] });
      queryClient.invalidateQueries({ queryKey: [GROCERY_ITEMS_QUERY_KEY, familyId] });
      queryClient.invalidateQueries({ queryKey: [GROCERY_SUMMARY_QUERY_KEY, familyId] });
    },
  });
};

export const useSeedGroceryItemsBackend = (familyId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => seedGroceryItemsApi(familyId ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GROCERY_ITEMS_QUERY_KEY, familyId] });
      queryClient.invalidateQueries({ queryKey: [GROCERY_SUMMARY_QUERY_KEY, familyId] });
    },
  });
};
