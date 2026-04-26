import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import {
  getGroceryItem,
  addGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  toggleItemCompletion,
} from "../../services/grocery";
import { QUERY_KEYS } from "../../constants/query-keys";
import { IGroceryItem } from "../../types";

/**
 * Real-time hook for family grocery list
 * @param familyId - The ID of the family
 */
export const useGroceryList = (familyId?: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = [QUERY_KEYS.GROCERY_LIST, familyId] as const;

  useEffect(() => {
    if (!familyId) return;

    const q = query(collection(db, "grocery_items"), where("familyId", "==", familyId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as IGroceryItem;
          return {
            ...data,
            id: data.id || docSnap.id,
          };
        });

        queryClient.setQueryData([QUERY_KEYS.GROCERY_LIST, familyId], items);
      },
      (error) => {
        console.error("Grocery list snapshot error:", error);
      },
    );

    return () => unsubscribe();
  }, [familyId, queryClient]);

  return useQuery<IGroceryItem[]>({
    queryKey,
    queryFn: async () => {
      if (!familyId) return [];
      const q = query(collection(db, "grocery_items"), where("familyId", "==", familyId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as IGroceryItem;
        return {
          ...data,
          id: data.id || docSnap.id,
        };
      });
    },
    enabled: !!familyId,
  });
};

/**
 * Hook for a single grocery item
 * @param itemId - The ID of the item
 */
export const useGroceryItem = (itemId?: string | null) => {
  return useQuery<IGroceryItem | null>({
    queryKey: [QUERY_KEYS.GROCERY_ITEM, itemId],
    queryFn: () => (itemId ? getGroceryItem(itemId) : null),
    enabled: !!itemId,
  });
};

/**
 * Mutation hook for adding a grocery item
 */
export const useAddGroceryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      familyId,
      item,
      user,
    }: {
      familyId: string;
      item: Partial<IGroceryItem>;
      user: { uid: string; name: string };
    }) => addGroceryItem(familyId, item, user),
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERY_LIST, newItem.familyId] });
    },
  });
};

/**
 * Mutation hook for updating a grocery item
 */
export const useUpdateGroceryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: Partial<IGroceryItem> }) =>
      updateGroceryItem(itemId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERY_ITEM, variables.itemId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERY_LIST] });
    },
  });
};

/**
 * Mutation hook for toggling item completion
 */
export const useToggleItemCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      item,
      user,
    }: {
      item: { id: string; name: string; status: "pending" | "completed"; familyId: string };
      user: { uid: string; name: string };
    }) => toggleItemCompletion(item, user),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERY_LIST, variables.item.familyId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERY_ITEM, variables.item.id] });
    },
  });
};

/**
 * Mutation hook for deleting a grocery item
 */
export const useDeleteGroceryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => deleteGroceryItem(itemId),
    onSuccess: (_, itemId) => {
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.GROCERY_ITEM, itemId] });
      // Since we don't have familyId here, we invalidate all grocery lists
      // or we could rely on the snapshot listener
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERY_LIST] });
    },
  });
};
