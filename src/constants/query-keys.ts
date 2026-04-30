/**
 * Centralized Query Keys
 * Why: To maintain consistency and avoid typos when accessing or invalidating cache.
 */
export const QUERY_KEYS = {
  FAMILY: "family",
  FAMILY_MEMBERS: "familyMembers",
  GROCERY_LIST: "groceryList",
  GROCERY_ITEM: "groceryItem",
  NOTIFICATIONS: "notifications",
} as const;
