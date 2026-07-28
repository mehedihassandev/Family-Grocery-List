/**
 * Centralized Query Keys
 * Why: To maintain consistency and avoid typos when accessing or invalidating cache.
 */
export const QUERY_KEYS = {
  FAMILY: "family",
  FAMILY_MEMBERS: "familyMembers",
  GROCERY_LIST: "groceryList",
  GROCERY_ITEM: "groceryItem",
  DATA_GROCERY_SUMMARY: "dataGrocerySummary",
  DATA_GROCERY_ITEMS: "dataGroceryItems",
  NOTIFICATIONS: "notifications",
  NOTIFICATION_UNREAD_COUNT: "notificationUnreadCount",
  USER_PROFILE: "userProfile",
  SUPERSTORE_COMPARISON: "superstoreComparison",
  BASKET_OPTIMIZATION: "basketOptimization",
  BASKET_SPLIT_OPTIMIZATION: "basketSplitOptimization",
  PRICE_ALERTS: "priceAlerts",
  MONTHLY_ANALYTICS: "monthlyAnalytics",
  AI_RECIPE: "aiRecipe",
} as const;
