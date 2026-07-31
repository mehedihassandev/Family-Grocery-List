/**
 * Navigation route constants — Single Source of Truth for all route names.
 *
 * Why a const object (not enums):
 *   - One place to read and change any route name.
 *   - `typeof ROUTES.X` works as a precise string-literal type in generics.
 *   - No enum-merging surprises; plain strings are debuggable at runtime.
 *
 * Reference pattern: 10Billion/Mobile-App constants/routes/index.ts
 */
export const ROUTES = {
  // ── Root navigator stacks ──────────────────────────────────────────────────
  UNAUTHENTICATED_STACK: "UnAuthenticatedStack",
  AUTHENTICATED_STACK: "AuthenticatedStack",
  ROOT: "Root",

  // ── Unauthenticated screens ────────────────────────────────────────────────
  LOGIN: "Login",

  // ── Authenticated screens ──────────────────────────────────────────────────
  FAMILY_SETUP: "FamilySetup",
  EDIT_PROFILE: "EditProfile",
  PRIVACY_SECURITY: "PrivacySecurity",
  HELP_SUPPORT: "HelpSupport",
  ADD_ITEM: "AddItem",
  ITEM_DETAIL: "ItemDetail",
  EDIT_ITEM: "EditItem",
  ANALYZE: "Analyze",
  NOTIFICATIONS: "Notifications",
  RECIPE_PACKS: "RecipePacks",
  STORE_COMPARISON: "StoreComparison",
  MEAL_PLAN: "MealPlan",
  RECIPE_DETAIL: "RecipeDetail",
  COOKING_MODE: "CookingMode",

  // ── Bottom tab screens ─────────────────────────────────────────────────────
  DASHBOARD: "Dashboard",
  GROCERIES: "Groceries",
  ANALYTICS: "Analytics",
  FAMILY: "Family",
  PROFILE: "Profile",
} as const;

/** Union of every route value — useful for generic constraints */
export type TRouteName = (typeof ROUTES)[keyof typeof ROUTES];
