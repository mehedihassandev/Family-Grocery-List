import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { ROUTES, TRouteName } from "../navigation/routes";

export * from "./apiModels";
export { ROUTES };
export type { TRouteName };

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

export type RootNavigatorParamList = {
  /** Unauthenticated shell — Login, Signup, etc. */
  [ROUTES.UNAUTHENTICATED_STACK]: undefined;
  /** Authenticated shell — Hosts the main app content */
  [ROUTES.AUTHENTICATED_STACK]: undefined;
};

/** Authenticated Stack — Screens available after login */
export type AuthenticatedStackNavigatorParamList = {
  /** The main tab navigator */
  [ROUTES.ROOT]: undefined;
  /** Prompt user to create or join a family after first login */
  [ROUTES.FAMILY_SETUP]: { mode?: "selection" | "create" | "join" } | undefined;
  /** Edit user display name / avatar */
  [ROUTES.EDIT_PROFILE]: undefined;
  /** Privacy & security settings */
  [ROUTES.PRIVACY_SECURITY]: undefined;
  /** Help & support FAQ */
  [ROUTES.HELP_SUPPORT]: undefined;
  /** Add a new item */
  [ROUTES.ADD_ITEM]: undefined;
  /** View item details */
  [ROUTES.ITEM_DETAIL]: { itemId: string };
  /** Edit an existing item */
  [ROUTES.EDIT_ITEM]: { itemId: string };
  /** Analytics screen (stack entry) */
  [ROUTES.ANALYZE]: undefined;
  /** Notification feed */
  [ROUTES.NOTIFICATIONS]: undefined;
};

/** Unauthenticated Stack — Screens available before login */
export type UnAuthenticatedStackNavigatorParamList = {
  [ROUTES.LOGIN]: undefined;
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
export type FamilyStackScreenProps = ITabScreenProps;
export type ProfileStackScreenProps = ITabScreenProps;

export type AnalyticsStackScreenProps = AuthenticatedStackNavigatorScreenProps<
  typeof ROUTES.ANALYZE
>;

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
