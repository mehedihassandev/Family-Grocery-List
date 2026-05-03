import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import { ERootRoutes, ETabRoutes } from "../navigation/routes";

export { ERootRoutes, ETabRoutes };

export type Priority = "Urgent" | "Medium" | "Low";

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

export interface IUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  familyId: string | null;
  role: "owner" | "member";
}

export interface IFamily {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: any;
}

export interface IGroceryItem {
  id: string;
  familyId: string;
  name: string;
  category: string;
  priority: Priority;
  notes?: string;
  quantity?: string;
  recurrenceFrequency?: "none" | "weekly" | "monthly";
  assignee?: {
    uid?: string;
    name: string;
  } | null;
  dueDate?: any | null;
  reminderAt?: any | null;
  unitPrice?: number | null;
  estimatedTotal?: number | null;
  status: "pending" | "completed";
  addedBy: {
    uid: string;
    name: string;
    photoURL?: string;
  };
  completedBy?: {
    uid: string;
    name: string;
    photoURL?: string;
  } | null;
  createdAt: any;
  updatedAt: any;
  completedAt?: any | null;
}

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
  /** Splash/loading gate while auth state resolves */
  [ERootRoutes.LOADING]: undefined;
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
};

/** Unauthenticated Stack — Screens available before login */
export type UnAuthenticatedStackNavigatorParamList = {
  [ERootRoutes.LOGIN]: undefined;
};

/** Bottom tab navigator — each tab maps to its own stack */
export type BottomTabNavigatorParamList = {
  HomeStack: undefined;
  ListStack: undefined;
  MembersStack: undefined;
  AnalyzeStack: undefined;
  ProfileStack: undefined;
};

// Sub-stacks for Tabs
export type HomeStackParamList = { Home: undefined };
export type ListStackParamList = { List: undefined };
export type MembersStackParamList = { Members: undefined };
export type AnalyzeStackParamList = { Analyze: undefined };
export type ProfileStackParamList = { Profile: undefined };

// ---------------------------------------------------------------------------
// Convenience prop types
// ---------------------------------------------------------------------------

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

export type BottomTabNavigatorScreenProps<T extends keyof BottomTabNavigatorParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<BottomTabNavigatorParamList, T>,
    AuthenticatedStackNavigatorScreenProps<keyof AuthenticatedStackNavigatorParamList>
  >;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  BottomTabNavigatorScreenProps<keyof BottomTabNavigatorParamList>
>;

export type ListStackScreenProps<T extends keyof ListStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ListStackParamList, T>,
  BottomTabNavigatorScreenProps<keyof BottomTabNavigatorParamList>
>;

export type MembersStackScreenProps<T extends keyof MembersStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<MembersStackParamList, T>,
  BottomTabNavigatorScreenProps<keyof BottomTabNavigatorParamList>
>;

export type AnalyzeStackScreenProps<T extends keyof AnalyzeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AnalyzeStackParamList, T>,
  BottomTabNavigatorScreenProps<keyof BottomTabNavigatorParamList>
>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, T>,
  BottomTabNavigatorScreenProps<keyof BottomTabNavigatorParamList>
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
  createdAt: any;
}
