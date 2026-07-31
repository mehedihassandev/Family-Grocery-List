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
    inviteMember: (id: string) => `/v1/families/${encodeURIComponent(id)}/members`,
    updateRole: (familyId: string, userId: string) =>
      `/v1/families/${encodeURIComponent(familyId)}/members/${encodeURIComponent(userId)}/role`,
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
  superstores: {
    search: "/v1/superstores/search",
    basketOptimization: "/v1/superstores/basket-optimization",
    basketSplitOptimization: "/v1/superstores/basket-split-optimization",
    priceAlerts: "/v1/superstores/price-alerts",
    checkPriceAlerts: "/v1/superstores/price-alerts/check",
    priceAlertDetail: (alertId: string) =>
      `/v1/superstores/price-alerts/${encodeURIComponent(alertId)}`,
  },
  ai: {
    recipeToGrocery: "/v1/ai/recipe-to-grocery",
    monthlyInsights: "/v1/ai/monthly-insights",
  },
  recipes: {
    list: "/v1/recipes",
    packs: "/v1/recipes/packs",
    detail: (id: string) => `/v1/recipes/${encodeURIComponent(id)}`,
    create: "/v1/recipes",
    addMissing: (familyId: string, recipeId: string) =>
      `/v1/families/${encodeURIComponent(familyId)}/recipes/${encodeURIComponent(recipeId)}/add-missing`,
  },
  mealPlans: {
    get: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}/meal-plans`,
    addItem: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}/meal-plans/item`,
  },
  deviceTokens: {
    register: "/v1/users/me/device-tokens",
    remove: (token: string) => `/v1/users/me/device-tokens/${encodeURIComponent(token)}`,
  },
  notifications: {
    list: (familyId: string) => `/v1/families/${encodeURIComponent(familyId)}/notifications`,
    unreadCount: (familyId: string) =>
      `/v1/families/${encodeURIComponent(familyId)}/notifications/unread-count`,
    markRead: (familyId: string, notificationId: string) =>
      `/v1/families/${encodeURIComponent(familyId)}/notifications/${encodeURIComponent(notificationId)}/read`,
    markAllRead: (familyId: string) =>
      `/v1/families/${encodeURIComponent(familyId)}/notifications/read-all`,
  },
} as const;
