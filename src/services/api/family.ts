import { apiClient } from "./config";
import { API_ENDPOINTS } from "./endpoints";
import { IFamily, ICreateFamilyRequest, IJoinFamilyRequest } from "../../models/family";
import { IUser } from "../../models/user";
import { IMessageResponse } from "../../models/common";

const normalizeFamilyResponse = (data: unknown): IFamily => {
  if (!data || typeof data !== "object") return data as IFamily;
  const raw = data as Record<string, unknown>;
  return {
    id: String(raw.id || raw._id || ""),
    name: String(raw.name || ""),
    inviteCode: String(raw.inviteCode || raw.invite_code || raw.code || raw.invite || ""),
    ownerId: String(raw.ownerId || raw.owner_id || ""),
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
  };
};

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

export const getFamilyDetailsApi = async (familyId: string): Promise<IFamily> => {
  if (!familyId) {
    throw new Error("Family id is required.");
  }
  const response = await apiClient.get<unknown>(API_ENDPOINTS.families.detail(familyId));
  return normalizeFamilyResponse(response.data);
};

export const getFamilyMembersApi = async (familyId: string): Promise<IUser[]> => {
  if (!familyId) {
    throw new Error("Family id is required.");
  }
  const response = await apiClient.get<unknown>(API_ENDPOINTS.families.members(familyId));
  if (Array.isArray(response.data)) {
    return response.data.map(normalizeUserResponse);
  }
  return [];
};

export const createFamilyApi = async (familyName: string): Promise<IFamily> => {
  if (!familyName.trim()) {
    throw new Error("Family name is required.");
  }
  const payload: ICreateFamilyRequest = { name: familyName.trim() };
  const response = await apiClient.post<unknown>(API_ENDPOINTS.families.create, payload);
  return normalizeFamilyResponse(response.data);
};

export const joinFamilyApi = async (inviteCode: string): Promise<IFamily> => {
  if (!inviteCode.trim()) {
    throw new Error("Invite code is required.");
  }
  const payload: IJoinFamilyRequest = { inviteCode: inviteCode.trim().toUpperCase() };
  const response = await apiClient.post<unknown>(API_ENDPOINTS.families.join, payload);
  return normalizeFamilyResponse(response.data);
};

export const leaveFamilyApi = async (familyId: string): Promise<IMessageResponse> => {
  if (!familyId) {
    throw new Error("Family id is required.");
  }
  const response = await apiClient.post<IMessageResponse>(API_ENDPOINTS.families.leave(familyId));
  return response.data;
};

export const removeMemberApi = async (
  familyId: string,
  targetUserId: string,
): Promise<IMessageResponse> => {
  if (!familyId || !targetUserId) {
    throw new Error("Family id and member user id are required.");
  }
  const response = await apiClient.delete<IMessageResponse>(
    API_ENDPOINTS.families.removeMember(familyId, targetUserId),
  );
  return response.data;
};
