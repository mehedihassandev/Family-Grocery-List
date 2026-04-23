import { GroceryItem, Priority } from "../../types";

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

export interface GroceryItemModel {
  id: string;
  title: string;
  category: GroceryCategory;
  priority: GroceryPriority;
  quantity: string;
  note: string;
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

type FirestoreTimestampLike = {
  seconds?: number;
  nanoseconds?: number;
  toMillis?: () => number;
};

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

const toTimestampMs = (value: unknown) => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (value && typeof value === "object") {
    const maybeTimestamp = value as FirestoreTimestampLike;

    if (typeof maybeTimestamp.toMillis === "function") {
      return maybeTimestamp.toMillis();
    }

    if (typeof maybeTimestamp.seconds === "number") {
      const nanos =
        typeof maybeTimestamp.nanoseconds === "number"
          ? maybeTimestamp.nanoseconds
          : 0;
      return maybeTimestamp.seconds * 1000 + Math.floor(nanos / 1_000_000);
    }
  }

  return 0;
};

export const toGroceryItemModel = (item: GroceryItem): GroceryItemModel => ({
  id: item.id,
  title: item.name,
  category: isKnownCategory(item.category) ? item.category : "Other",
  priority: legacyToModelPriority[item.priority],
  quantity: item.quantity ?? "",
  note: item.notes ?? "",
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

export const fromGroceryItemModel = (
  item: GroceryItemModel,
): Partial<GroceryItem> => ({
  id: item.id,
  name: item.title,
  category: item.category,
  priority: modelToLegacyPriority[item.priority],
  quantity: item.quantity,
  notes: item.note,
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

export const sortGroceryItemsForHome = (items: GroceryItemModel[]) => {
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

export const sortLegacyGroceryItemsForHome = (items: GroceryItem[]) => {
  const models = items.map(toGroceryItemModel);
  const sortedModels = sortGroceryItemsForHome(models);

  const byId = new Map(items.map((item) => [item.id, item]));
  return sortedModels
    .map((model) => byId.get(model.id))
    .filter((item): item is GroceryItem => Boolean(item));
};
