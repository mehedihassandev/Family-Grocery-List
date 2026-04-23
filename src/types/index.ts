import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { BottomTabNavigationProp, BottomTabScreenProps } from "@react-navigation/bottom-tabs";

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

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  familyId: string | null;
  role: "owner" | "member";
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: any;
}

export interface GroceryItem {
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
  };
  completedBy?: {
    uid: string;
    name: string;
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
  Loading: undefined;
  /** Email / Google sign-in & sign-up */
  Login: undefined;
  /** Authenticated shell — hosts the bottom tab navigator */
  Main: undefined;
  /** Prompt user to create or join a family after first login */
  FamilySetup: undefined;
  /** Dedicated screen to create a new family group */
  CreateFamily: undefined;
  /** Dedicated screen to join via invite code */
  JoinFamily: undefined;
  /** Edit user display name / avatar */
  EditProfile: undefined;
  /** Privacy & security settings */
  PrivacySecurity: undefined;
  /** Help & support FAQ */
  HelpSupport: undefined;
};

/** Bottom tab navigator — each tab maps to its own screen */
export type TabParamList = {
  Home: undefined;
  List: undefined;
  Members: undefined;
  Analyze: undefined;
  Profile: undefined;
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

export interface AppNotification {
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
