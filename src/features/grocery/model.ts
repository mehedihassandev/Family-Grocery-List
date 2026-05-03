import { IGroceryItem, Priority } from "../../types";

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
export type GroceryStatus = "pending" | "completed";
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
  due_date: unknown | null;
  reminder_at: unknown | null;
  unit_price: number | null;
  estimated_total: number | null;
  status: GroceryStatus;
  family_id: string;
  created_by: string;
  created_by_name: string;
  completed_by: string | null;
  completed_by_name: string | null;
  created_at: unknown;
  updated_at: unknown;
  completed_at: unknown | null;
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
  priority: legacyToModelPriority[item.priority],
  quantity: item.quantity ?? "",
  note: item.notes ?? "",
  recurrence_frequency: item.recurrenceFrequency ?? "none",
  assignee_name: item.assignee?.name ?? null,
  due_date: item.dueDate ?? null,
  reminder_at: item.reminderAt ?? null,
  unit_price: typeof item.unitPrice === "number" ? item.unitPrice : null,
  estimated_total: typeof item.estimatedTotal === "number" ? item.estimatedTotal : null,
  status: item.status,
  family_id: item.familyId,
  created_by: item.addedBy.uid,
  created_by_name: item.addedBy.name,
  completed_by: item.completedBy?.uid ?? null,
  completed_by_name: item.completedBy?.name ?? null,
  created_at: item.createdAt,
  updated_at: item.updatedAt,
  completed_at: item.completedAt ?? null,
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
  dueDate: item.due_date,
  reminderAt: item.reminder_at,
  unitPrice: item.unit_price,
  estimatedTotal: item.estimated_total,
  status: item.status,
  familyId: item.family_id,
  addedBy: {
    uid: item.created_by,
    name: item.created_by_name,
  },
  completedBy: item.completed_by
    ? {
        uid: item.completed_by,
        name: item.completed_by_name ?? "",
      }
    : null,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  completedAt: item.completed_at,
});

/**
 * Sorts grocery item models for the home screen
 * @param items - The grocery item models to sort
 */
export const sortGroceryItemsForHome = (items: IGroceryItemModel[]) => {
  const priorityRank: Record<GroceryPriority, number> = {
    urgent: 0,
    medium: 1,
    low: 2,
  };

  return [...items].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "pending" ? -1 : 1;
    }

    const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return toTimestampMs(b.created_at) - toTimestampMs(a.created_at);
  });
};

/**
 * Sorts legacy grocery items for the home screen by converting to models first
 * @param items - The legacy grocery items to sort
 */
export const sortLegacyGroceryItemsForHome = (items: IGroceryItem[]) => {
  const models = items.map(toGroceryItemModel);
  const sortedModels = sortGroceryItemsForHome(models);

  const byId = new Map(items.map((item) => [item.id, item]));
  return sortedModels
    .map((model) => byId.get(model.id))
    .filter((item): item is IGroceryItem => Boolean(item));
};
