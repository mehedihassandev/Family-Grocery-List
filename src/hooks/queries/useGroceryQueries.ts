import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addGroceryItemApi,
  getFamilyGroceryItemsApi,
  getFamilyGrocerySummaryApi,
  getGroceryItemDetailApi,
  modifyGroceryItemApi,
  removeGroceryItemApi,
  seedGroceryItemsApi,
} from "../../services/api/grocery";
import {
  ICreateGroceryItemRequest,
  IDataGrocerySummary,
  IGroceryItem,
  IUpdateGroceryItemRequest,
  TItemStatus,
} from "../../models/grocery";

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

const getNextStatus = (currentStatus: TItemStatus): TItemStatus => {
  if (currentStatus === "pending") return "in_cart";
  if (currentStatus === "in_cart") return "completed";
  return "pending";
};

export const useToggleItemCompletionBackend = (familyId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, currentStatus }: { itemId: string; currentStatus: TItemStatus }) => {
      const nextStatus = getNextStatus(currentStatus);
      return modifyGroceryItemApi(familyId ?? "", itemId, {
        status: nextStatus,
      });
    },
    onMutate: async ({ itemId, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: [GROCERY_ITEMS_QUERY_KEY, familyId] });

      const previousItems = queryClient.getQueryData<IGroceryItem[]>([
        GROCERY_ITEMS_QUERY_KEY,
        familyId,
      ]);

      const nextStatus = getNextStatus(currentStatus);

      if (previousItems) {
        queryClient.setQueryData<IGroceryItem[]>([GROCERY_ITEMS_QUERY_KEY, familyId], (old) =>
          (old || []).map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  status: nextStatus,
                  completedAt: nextStatus === "completed" ? new Date().toISOString() : null,
                  claimedAt: nextStatus === "in_cart" ? new Date().toISOString() : null,
                }
              : item,
          ),
        );
      }

      return { previousItems };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData([GROCERY_ITEMS_QUERY_KEY, familyId], context.previousItems);
      }
    },
    onSettled: (_, __, variables) => {
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
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: [GROCERY_ITEMS_QUERY_KEY, familyId] });

      const previousItems = queryClient.getQueryData<IGroceryItem[]>([
        GROCERY_ITEMS_QUERY_KEY,
        familyId,
      ]);

      if (previousItems) {
        queryClient.setQueryData<IGroceryItem[]>([GROCERY_ITEMS_QUERY_KEY, familyId], (old) =>
          (old || []).filter((item) => item.id !== itemId),
        );
      }

      return { previousItems };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData([GROCERY_ITEMS_QUERY_KEY, familyId], context.previousItems);
      }
    },
    onSettled: () => {
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
