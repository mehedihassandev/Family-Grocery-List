import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { BottomTabNavigationProp, BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { ERootRoutes, ETabRoutes } from "../navigation/routes";

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

/** Root (modal) stack — unauthenticated + authenticated screens */
export type RootStackParamList = {
  /** Splash/loading gate while auth state resolves */
  [ERootRoutes.LOADING]: undefined;
  /** Email / Google sign-in & sign-up */
  [ERootRoutes.LOGIN]: undefined;
  /** Authenticated shell — hosts the bottom tab navigator */
  [ERootRoutes.MAIN]: undefined;
  /** Prompt user to create or join a family after first login */
  [ERootRoutes.FAMILY_SETUP]: undefined;
  /** Dedicated screen to create a new family group */
  [ERootRoutes.CREATE_FAMILY]: undefined;
  /** Dedicated screen to join via invite code */
  [ERootRoutes.JOIN_FAMILY]: undefined;
  /** Edit user display name / avatar */
  [ERootRoutes.EDIT_PROFILE]: undefined;
  /** Privacy & security settings */
  [ERootRoutes.PRIVACY_SECURITY]: undefined;
  /** Help & support FAQ */
  [ERootRoutes.HELP_SUPPORT]: undefined;
};

/** Bottom tab navigator — each tab maps to its own screen */
export type TabParamList = {
  [ETabRoutes.HOME]: undefined;
  [ETabRoutes.LIST]: undefined;
  [ETabRoutes.MEMBERS]: undefined;
  [ETabRoutes.ANALYZE]: undefined;
  [ETabRoutes.PROFILE]: undefined;
};

// Convenience prop types — import these in screen components instead of
// the verbose NativeStackNavigationProp<RootStackParamList, 'ScreenName'>
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;

/** Screen-level props for a given root-stack route name */
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

/** Screen-level props for a given tab route name */
export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>;

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
