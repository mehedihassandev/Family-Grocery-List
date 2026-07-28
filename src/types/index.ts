import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { ERootRoutes, ETabRoutes } from "../navigation/routes";

export * from "./apiModels";
export { ERootRoutes, ETabRoutes };

export type Priority = "Urgent" | "High" | "Medium" | "Low";

export type Category =
  | "Beauty"
  | "Meat"
  | "Fish"
  | "Vegetables"
  | "Fruits"
  | "Dairy"
  | "Snacks"
  | "Drinks"
  | "Household"
  | "Medicine"
  | "Other";

interface IFirestoreTimestampLike {
  toDate?: () => Date;
  toMillis?: () => number;
  seconds?: number;
  nanoseconds?: number;
}

export type TFirestoreDateValue = (Date & IFirestoreTimestampLike) | IFirestoreTimestampLike | null;

export type NotificationType = "item_added" | "item_completed" | "urgent_item";

// ---------------------------------------------------------------------------
// Navigation param lists — every stack screen and its expected route params.
// Keeping params here (instead of inline in navigator files) means all screens
// import from a single source of truth and type-check route params for free.
// ---------------------------------------------------------------------------

/** Root (modal) stack — handles the high-level Auth switch */
export type RootNavigatorParamList = {
  /** Unauthenticated shell — Login, Signup, etc. */
  UnAuthenticatedStack: undefined;
  /** Authenticated shell — Hosts the main app content */
  AuthenticatedStack: undefined;
};

/** Authenticated Stack — Screens available after login */
export type AuthenticatedStackNavigatorParamList = {
  /** The main tab navigator */
  Root: undefined;
  /** Prompt user to create or join a family after first login */
  [ERootRoutes.FAMILY_SETUP]: { mode?: "selection" | "create" | "join" } | undefined;
  /** Edit user display name / avatar */
  [ERootRoutes.EDIT_PROFILE]: undefined;
  /** Privacy & security settings */
  [ERootRoutes.PRIVACY_SECURITY]: undefined;
  /** Help & support FAQ */
  [ERootRoutes.HELP_SUPPORT]: undefined;
  /** Add a new item */
  [ERootRoutes.ADD_ITEM]: undefined;

  // New screens that were previously Modals
  [ERootRoutes.ITEM_DETAIL]: { itemId: string };
  [ERootRoutes.EDIT_ITEM]: { itemId: string };
  [ERootRoutes.ANALYZE]: undefined;
  [ERootRoutes.NOTIFICATIONS]: undefined;
};

/** Unauthenticated Stack — Screens available before login */
export type UnAuthenticatedStackNavigatorParamList = {
  [ERootRoutes.LOGIN]: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootNavigatorParamList>;

export type RootNavigatorScreenProps<T extends keyof RootNavigatorParamList> =
  NativeStackScreenProps<RootNavigatorParamList, T>;

export type AuthenticatedStackNavigationProp =
  NativeStackNavigationProp<AuthenticatedStackNavigatorParamList>;

export type AuthenticatedStackNavigatorScreenProps<
  T extends keyof AuthenticatedStackNavigatorParamList,
> = NativeStackScreenProps<AuthenticatedStackNavigatorParamList, T>;

export type UnAuthenticatedStackNavigatorScreenProps<
  T extends keyof UnAuthenticatedStackNavigatorParamList,
> = NativeStackScreenProps<UnAuthenticatedStackNavigatorParamList, T>;

export type TActiveTab = "dashboard" | "groceries" | "analytics" | "family" | "profile";

export interface ITabScreenProps {
  navigation: any;
  onTabChange: (tab: TActiveTab) => void;
}

export type HomeStackScreenProps = ITabScreenProps;
export type ListStackScreenProps = ITabScreenProps;
export type MembersStackScreenProps = ITabScreenProps;
export type ProfileStackScreenProps = ITabScreenProps;

export type AnalyzeStackScreenProps = AuthenticatedStackNavigatorScreenProps<ERootRoutes.ANALYZE>;

export interface IAppNotification {
  id: string;
  familyId: string;
  type: NotificationType;
  title: string;
  message: string;
  actorId: string;
  actorName: string;
  itemId?: string;
  itemName?: string;
  readBy: string[];
  createdAt: TFirestoreDateValue;
}

export * from "./superstore";
