/**
 * Navigation route enums for the application
 * Why: To prevent string typos and provide a central source of truth for routing.
 */

export enum ERootRoutes {
  LOADING = "Loading",
  LOGIN = "Login",
  MAIN = "Main",
  FAMILY_SETUP = "FamilySetup",
  EDIT_PROFILE = "EditProfile",
  PRIVACY_SECURITY = "PrivacySecurity",
  HELP_SUPPORT = "HelpSupport",
  ADD_ITEM = "AddItem",
  ITEM_DETAIL = "ItemDetail",
  EDIT_ITEM = "EditItem",
}

export enum ETabRoutes {
  HOME = "HomeStack",
  LIST = "ListStack",
  MEMBERS = "MembersStack",
  ANALYZE = "AnalyzeStack",
  PROFILE = "ProfileStack",
}
