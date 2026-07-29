import { IGroceryItem, Priority, TItemStatus } from "../../types";

export const GROCERY_CATEGORIES = [
  "Beauty",
  "Meat",
  "Fish",
  "Vegetables",
  "Fruits",
  "Dairy",
  "Snacks",
  "Drinks",
  "Household",
  "Other",
] as const;

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number];
export type GroceryStatus = "pending" | "in_cart" | "completed";
export type GroceryPriority = "urgent" | "medium" | "low";

export interface IGroceryItemModel {
  id: string;
  title: string;
  category: GroceryCategory;
  priority: GroceryPriority;
  quantity: string;
  note: string;
  recurrence_frequency: "none" | "weekly" | "monthly";
  assignee_name: string | null;
  due_date: string | Date | null;
  reminder_at: string | Date | null;
  unit_price: number | null;
  estimated_total: number | null;
  status: GroceryStatus;
  family_id: string;
  created_by: string;
  created_by_name: string;
  claimed_by: string | null;
  claimed_by_name: string | null;
  completed_by: string | null;
  completed_by_name: string | null;
  created_at: string | Date;
  updated_at: string | Date;
  claimed_at: string | Date | null;
  completed_at: string | Date | null;
}

interface IFirestoreTimestampLike {
  seconds?: number;
  nanoseconds?: number;
  toMillis?: () => number;
}

/**
 * Checks if a string is a known grocery category
 * @param value - The category string to check
 */
const isKnownCategory = (value: string): value is GroceryCategory =>
  (GROCERY_CATEGORIES as readonly string[]).includes(value);

const legacyToModelPriority: Record<Priority, GroceryPriority> = {
  Urgent: "urgent",
  High: "urgent",
  Medium: "medium",
  Low: "low",
};

const modelToLegacyPriority: Record<GroceryPriority, Priority> = {
  urgent: "Urgent",
  medium: "Medium",
  low: "Low",
};

/**
 * Converts various date/timestamp types to milliseconds
 * @param value - The value to convert
 */
const toTimestampMs = (value: unknown) => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (value && typeof value === "object") {
    const maybeTimestamp = value as IFirestoreTimestampLike;

    if (typeof maybeTimestamp.toMillis === "function") {
      return maybeTimestamp.toMillis();
    }

    if (typeof maybeTimestamp.seconds === "number") {
      const nanos = typeof maybeTimestamp.nanoseconds === "number" ? maybeTimestamp.nanoseconds : 0;
      return maybeTimestamp.seconds * 1000 + Math.floor(nanos / 1_000_000);
    }
  }

  return 0;
};

/**
 * Maps a legacy IGroceryItem to the new IGroceryItemModel
 * @param item - The legacy grocery item
 */
export const toGroceryItemModel = (item: IGroceryItem): IGroceryItemModel => ({
  id: item.id,
  title: item.name,
  category: isKnownCategory(item.category) ? item.category : "Other",
  priority: legacyToModelPriority[item.priority] || "medium",
  quantity: item.quantity ?? "",
  note: item.notes ?? "",
  recurrence_frequency:
    item.recurrenceFrequency === "weekly" || item.recurrenceFrequency === "monthly"
      ? item.recurrenceFrequency
      : "none",
  assignee_name: item.assignee?.name ?? null,
  due_date: (item.dueDate as string | Date) ?? null,
  reminder_at: (item.reminderAt as string | Date) ?? null,
  unit_price: typeof item.unitPrice === "number" ? item.unitPrice : null,
  estimated_total: typeof item.estimatedTotal === "number" ? item.estimatedTotal : null,
  status: item.status,
  family_id: item.familyId,
  created_by: item.addedBy?.uid ?? "",
  created_by_name: item.addedBy?.name ?? "",
  claimed_by: item.claimedBy?.uid ?? null,
  claimed_by_name: item.claimedBy?.name ?? null,
  completed_by: item.completedBy?.uid ?? null,
  completed_by_name: item.completedBy?.name ?? null,
  created_at: (item.createdAt as string | Date) ?? "",
  updated_at: (item.updatedAt as string | Date) ?? "",
  claimed_at: (item.claimedAt as string | Date) ?? null,
  completed_at: (item.completedAt as string | Date) ?? null,
});

/**
 * Maps a IGroceryItemModel back to a partial legacy IGroceryItem
 * @param item - The grocery item model
 */
export const fromGroceryItemModel = (item: IGroceryItemModel): Partial<IGroceryItem> => ({
  id: item.id,
  name: item.title,
  category: item.category,
  priority: modelToLegacyPriority[item.priority],
  quantity: item.quantity,
  notes: item.note,
  recurrenceFrequency: item.recurrence_frequency,
  assignee: item.assignee_name ? { name: item.assignee_name } : null,
  dueDate: item.due_date as string | Date | null,
  reminderAt: item.reminder_at as string | Date | null,
  unitPrice: item.unit_price,
  estimatedTotal: item.estimated_total,
  status: item.status,
  familyId: item.family_id,
  addedBy: {
    uid: item.created_by,
    name: item.created_by_name,
  },
  claimedBy: item.claimed_by
    ? {
        uid: item.claimed_by,
        name: item.claimed_by_name ?? "",
      }
    : null,
  completedBy: item.completed_by
    ? {
        uid: item.completed_by,
        name: item.completed_by_name ?? "",
      }
    : null,
  createdAt: item.created_at as string | Date,
  updatedAt: item.updated_at as string | Date,
  claimedAt: item.claimed_at as string | Date | null,
  completedAt: item.completed_at as string | Date | null,
});

/**
 * Sorts grocery items by status (pending -> in_cart -> completed) and priority
 * @param items - The items to sort
 */
export const sortGroceryItems = (items: IGroceryItemModel[]): IGroceryItemModel[] => {
  const statusWeights: Record<GroceryStatus, number> = {
    pending: 1,
    in_cart: 2,
    completed: 3,
  };

  const priorityWeights: Record<GroceryPriority, number> = {
    urgent: 3,
    medium: 2,
    low: 1,
  };

  return [...items].sort((a, b) => {
    // Sort by status: pending (1) -> in_cart (2) -> completed (3)
    if (a.status !== b.status) {
      return statusWeights[a.status] - statusWeights[b.status];
    }

    // Sort by priority weight
    const priorityDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    // Sort by creation date (newest first)
    return toTimestampMs(b.created_at) - toTimestampMs(a.created_at);
  });
};

/**
 * Sorts legacy IGroceryItem list for HomeScreen
 */
export const sortLegacyGroceryItemsForHome = (items: IGroceryItem[]): IGroceryItem[] => {
  const statusWeights: Record<TItemStatus, number> = {
    pending: 1,
    in_cart: 2,
    completed: 3,
  };

  const priorityWeights: Record<Priority, number> = {
    Urgent: 3,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  return [...items].sort((a, b) => {
    if (a.status !== b.status) {
      return statusWeights[a.status] - statusWeights[b.status];
    }
    const weightA = priorityWeights[a.priority] || 1;
    const weightB = priorityWeights[b.priority] || 1;
    if (weightA !== weightB) {
      return weightB - weightA;
    }
    return toTimestampMs(b.createdAt) - toTimestampMs(a.createdAt);
  });
};
