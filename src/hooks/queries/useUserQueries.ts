import { useQuery } from "@tanstack/react-query";
import { getUserMeApi } from "../../services/api/user";
import { IUser } from "../../models/user";
import { useAuthStore } from "../../store/useAuthStore";

export const USER_PROFILE_QUERY_KEY = "userProfile" as const;

export const useUserMe = () => {
  const { hasHydrated, loading, user } = useAuthStore();
  const canFetch = Boolean(hasHydrated && !loading && user?.uid);

  return useQuery<IUser>({
    queryKey: [USER_PROFILE_QUERY_KEY, user?.uid],
    queryFn: () => getUserMeApi(),
    enabled: canFetch,
    staleTime: 60 * 1000,
  });
};
