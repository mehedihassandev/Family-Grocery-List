export const DATA_API_BASE_URL = (
  process.env.EXPO_PUBLIC_DATA_API_BASE_URL || "https://family-grocery-data-api.onrender.com"
).replace(/\/+$/, "");

export const API_ENDPOINTS = {
  HEALTH: "/health",
  USER_ME: "/v1/users/me",
  FAMILIES: "/v1/families",
  FAMILIES_JOIN: "/v1/families/join",
  FAMILY_DETAIL: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}`,
  FAMILY_MEMBERS: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}/members`,
  FAMILY_LEAVE: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}/leave`,
  FAMILY_REMOVE_MEMBER: (familyId: string, userId: string) =>
    `/v1/families/${encodeURIComponent(familyId)}/members/${encodeURIComponent(userId)}`,
  GROCERY_ITEMS: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}/items`,
  GROCERY_ITEM_DETAIL: (familyId: string, itemId: string) =>
    `/v1/families/${encodeURIComponent(familyId)}/items/${encodeURIComponent(itemId)}`,
  GROCERY_SEED: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}/seed`,
  GROCERY_SUMMARY: (familyId: string) =>
    `/v1/families/${encodeURIComponent(familyId)}/grocery-summary`,
} as const;
