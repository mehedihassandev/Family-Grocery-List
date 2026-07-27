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
  USER_PROFILE: "userProfile",
} as const;
