export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_DATA_API_BASE_URL || "https://family-grocery-data-api.onrender.com"
).replace(/\/+$/, "");

export const API_ENDPOINTS = {
  health: "/health",
  user: {
    me: "/v1/users/me",
  },
  families: {
    create: "/v1/families",
    join: "/v1/families/join",
    detail: (id: string) => `/v1/families/${encodeURIComponent(id)}`,
    members: (id: string) => `/v1/families/${encodeURIComponent(id)}/members`,
    leave: (id: string) => `/v1/families/${encodeURIComponent(id)}/leave`,
    removeMember: (familyId: string, userId: string) =>
      `/v1/families/${encodeURIComponent(familyId)}/members/${encodeURIComponent(userId)}`,
  },
  grocery: {
    items: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}/items`,
    detail: (familyId: string, itemId: string) =>
      `/v1/families/${encodeURIComponent(familyId)}/items/${encodeURIComponent(itemId)}`,
    seed: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}/seed`,
    summary: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}/grocery-summary`,
  },
} as const;
