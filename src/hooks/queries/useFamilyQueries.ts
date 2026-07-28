import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFamilyDetailsApi,
  getFamilyMembersApi,
  createFamilyApi,
  joinFamilyApi,
  leaveFamilyApi,
  removeMemberApi,
  inviteMemberApi,
  updateMemberRoleApi,
} from "../../services/api/family";
import { IFamily } from "../../models/family";
import { IUser } from "../../models/user";
import { useAuthStore } from "../../store/useAuthStore";

// ─── Query Keys ──────────────────────────────────────────────────────────────
export const FAMILY_QUERY_KEY = "family" as const;
export const FAMILY_MEMBERS_QUERY_KEY = "familyMembers" as const;
export const GROCERY_LIST_QUERY_KEY = "groceryList" as const;

// ─── Query & Mutation Hooks ──────────────────────────────────────────────────
export const useFamilyDetails = (familyId?: string | null) => {
  const { hasHydrated, loading, user } = useAuthStore();
  const canFetch = Boolean(familyId && hasHydrated && !loading && user?.uid);

  return useQuery<IFamily | null>({
    queryKey: [FAMILY_QUERY_KEY, familyId],
    queryFn: async () => {
      if (!familyId) return null;
      return getFamilyDetailsApi(familyId);
    },
    enabled: canFetch,
    staleTime: 30 * 1000,
  });
};

export const useFamilyMembers = (familyId?: string | null) => {
  const { hasHydrated, loading, user } = useAuthStore();
  const canFetch = Boolean(familyId && hasHydrated && !loading && user?.uid);

  return useQuery<IUser[]>({
    queryKey: [FAMILY_MEMBERS_QUERY_KEY, familyId],
    queryFn: async () => {
      if (!familyId) return [];
      return getFamilyMembersApi(familyId);
    },
    enabled: canFetch,
    staleTime: 30 * 1000,
  });
};

export const useJoinFamily = () => {
  const queryClient = useQueryClient();
  const updateUserFamily = useAuthStore((state) => state.updateUserFamily);

  return useMutation({
    mutationFn: ({ inviteCode }: { userId?: string; inviteCode: string }) =>
      joinFamilyApi(inviteCode),
    onSuccess: (family) => {
      updateUserFamily(family.id, "member");
      queryClient.setQueryData([FAMILY_QUERY_KEY, family.id], family);
      queryClient.invalidateQueries({ queryKey: [FAMILY_MEMBERS_QUERY_KEY, family.id] });
    },
  });
};

export const useCreateFamily = () => {
  const queryClient = useQueryClient();
  const updateUserFamily = useAuthStore((state) => state.updateUserFamily);

  return useMutation({
    mutationFn: ({ familyName }: { userId?: string; familyName: string }) =>
      createFamilyApi(familyName),
    onSuccess: (family) => {
      updateUserFamily(family.id, "owner");
      queryClient.setQueryData([FAMILY_QUERY_KEY, family.id], family);
      queryClient.invalidateQueries({ queryKey: [FAMILY_MEMBERS_QUERY_KEY, family.id] });
    },
  });
};

export const useLeaveFamily = () => {
  const queryClient = useQueryClient();
  const updateUserFamily = useAuthStore((state) => state.updateUserFamily);

  return useMutation({
    mutationFn: (params: { familyId: string; userId?: string; role?: IUser["role"] }) =>
      leaveFamilyApi(params.familyId),
    onSuccess: (_, variables) => {
      updateUserFamily(null);
      queryClient.removeQueries({ queryKey: [FAMILY_QUERY_KEY, variables.familyId] });
      queryClient.removeQueries({ queryKey: [FAMILY_MEMBERS_QUERY_KEY, variables.familyId] });
      queryClient.invalidateQueries({ queryKey: [GROCERY_LIST_QUERY_KEY, variables.familyId] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { familyId: string; targetUserId: string; ownerId?: string }) =>
      removeMemberApi(params.familyId, params.targetUserId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [FAMILY_MEMBERS_QUERY_KEY, variables.familyId] });
    },
  });
};

export const useInviteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { familyId: string; email: string }) =>
      inviteMemberApi(params.familyId, params.email),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [FAMILY_MEMBERS_QUERY_KEY, variables.familyId] });
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      familyId: string;
      targetUserId: string;
      role: "owner" | "member" | "admin";
    }) => updateMemberRoleApi(params.familyId, params.targetUserId, params.role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [FAMILY_MEMBERS_QUERY_KEY, variables.familyId] });
    },
  });
};
