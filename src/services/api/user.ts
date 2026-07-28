import { apiClient } from "./config";
import { API_ENDPOINTS } from "./endpoints";
import { IUser } from "../../types";

const normalizeUserResponse = (data: unknown): IUser => {
  if (!data || typeof data !== "object") return data as IUser;
  const raw = data as Record<string, unknown>;
  return {
    uid: String(raw.uid || raw.id || raw._id || ""),
    email: String(raw.email || ""),
    displayName: String(raw.displayName || raw.display_name || raw.name || ""),
    photoURL:
      raw.photoURL || raw.photo_url || raw.avatar
        ? String(raw.photoURL || raw.photo_url || raw.avatar)
        : null,
    familyId: raw.familyId || raw.family_id ? String(raw.familyId || raw.family_id) : null,
    role: (raw.role === "owner" ? "owner" : "member") as IUser["role"],
  };
};

/**
 * Fetches logged-in user profile from /v1/users/me
 */
export const getUserMeApi = async (): Promise<IUser> => {
  const response = await apiClient.get<unknown>(API_ENDPOINTS.user.me);
  return normalizeUserResponse(response.data);
};
