import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import {
  getFamilyDetails,
  createFamily,
  joinFamily,
  leaveFamily,
  removeMemberAsOwner,
} from "../../services/family";
import { QUERY_KEYS } from "../../constants/query-keys";
import { IFamily, IUser } from "../../types";

/**
 * Real-time hook for family details
 * @param familyId - The ID of the family
 */
export const useFamilyDetails = (familyId?: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!familyId) return;

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, "families", familyId),
      (snapshot) => {
        if (snapshot.exists()) {
          queryClient.setQueryData([QUERY_KEYS.FAMILY, familyId], snapshot.data() as IFamily);
        } else {
          queryClient.setQueryData([QUERY_KEYS.FAMILY, familyId], null);
        }
      },
      (error) => {
        console.error("Family snapshot error:", error);
      },
    );

    return () => unsubscribe();
  }, [familyId, queryClient]);

  return useQuery<IFamily | null>({
    queryKey: [QUERY_KEYS.FAMILY, familyId],
    queryFn: () => (familyId ? getFamilyDetails(familyId) : null),
    enabled: !!familyId,
  });
};

/**
 * Real-time hook for family members
 * @param familyId - The ID of the family
 */
export const useFamilyMembers = (familyId?: string | null) => {
  const queryClient = useQueryClient();
  const queryKey = [QUERY_KEYS.FAMILY_MEMBERS, familyId] as const;

  useEffect(() => {
    if (!familyId) return;

    const q = query(collection(db, "users"), where("familyId", "==", familyId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const members = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as IUser;
          return {
            ...data,
            uid: data.uid || docSnap.id,
          };
        });

        queryClient.setQueryData([QUERY_KEYS.FAMILY_MEMBERS, familyId], members);
      },
      (error) => {
        console.error("Members snapshot error:", error);
      },
    );

    return () => unsubscribe();
  }, [familyId, queryClient]);

  return useQuery<IUser[]>({
    queryKey,
    queryFn: async () => {
      if (!familyId) return [];
      const q = query(collection(db, "users"), where("familyId", "==", familyId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as IUser;
        return {
          ...data,
          uid: data.uid || docSnap.id,
        };
      });
    },
    enabled: !!familyId,
  });
};

/**
 * Mutation hook for joining a family
 */
export const useJoinFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, inviteCode }: { userId: string; inviteCode: string }) =>
      joinFamily(userId, inviteCode),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAMILY, data.id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAMILY_MEMBERS, data.id] });
    },
  });
};

/**
 * Mutation hook for creating a family
 */
export const useCreateFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, familyName }: { userId: string; familyName: string }) =>
      createFamily(userId, familyName),
    onSuccess: (data) => {
      queryClient.setQueryData([QUERY_KEYS.FAMILY, data.id], data);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAMILY_MEMBERS, data.id] });
    },
  });
};

/**
 * Mutation hook for leaving a family
 */
export const useLeaveFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { userId: string; familyId: string; role?: IUser["role"] }) =>
      leaveFamily(params),
    onSuccess: (_, variables) => {
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.FAMILY, variables.familyId] });
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.FAMILY_MEMBERS, variables.familyId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROCERY_LIST, variables.familyId] });
    },
  });
};

/**
 * Mutation hook for removing a member
 */
export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { ownerId: string; familyId: string; targetUserId: string }) =>
      removeMemberAsOwner(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAMILY_MEMBERS, variables.familyId] });
    },
  });
};
