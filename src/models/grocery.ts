export type TPriority = "Urgent" | "High" | "Medium" | "Low";
export type TItemStatus = "pending" | "in_cart" | "completed";
export type TItemUnit =
  "pcs" | "kg" | "g" | "L" | "ml" | "pack" | "lb" | "oz" | "box" | "bottle" | "dozen";

export interface IGroceryActor {
  uid?: string;
  name?: string;
  photoURL?: string | null;
}

export interface IGroceryItem {
  id: string;
  familyId: string;
  name: string;
  category: string;
  priority: TPriority;
  quantity?: string | null;
  unit?: TItemUnit | null;
  notes?: string | null;
  status: TItemStatus;
  addedBy?: IGroceryActor | null;
  claimedBy?: IGroceryActor | null;
  completedBy?: IGroceryActor | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  claimedAt?: string | Date | null;
  completedAt?: string | Date | null;

  // Extended app fields for UI compatibility
  recurrenceFrequency?: string | null;
  assignee?: IGroceryActor | null;
  dueDate?: string | Date | null;
  reminderAt?: string | Date | null;
  unitPrice?: number | null;
  actualPrice?: number | null;
  estimatedTotal?: number | null;

  // Meal & Consumption fields
  mealType?: "Breakfast" | "Lunch" | "Dinner" | "Snacks" | "General" | null;
  servingsCount?: number | null;
  monthlyUsageFrequency?: number | null;
  selectedSuperstore?: "Shwapno" | "Meena Bazar" | "Agora" | "Best Price" | null;
  storeName?: string | null;
  unitPriceNormalized?: number | null;
}

export interface IGrocerySummary {
  familyId: string;
  totalItems: number;
  pendingItems: number;
  inCartItems: number;
  completedItems: number;
  urgentItems: number;
  categoryTotals: Record<string, number>;
  updatedAt?: string | null;
}

export type IDataGrocerySummary = IGrocerySummary;

export interface ICreateGroceryItemRequest {
  name: string;
  category?: string;
  priority?: TPriority;
  quantity?: string | null;
  unit?: TItemUnit | null;
  unitPrice?: number | null;
  notes?: string | null;
}

export interface IUpdateGroceryItemRequest {
  name?: string | null;
  category?: string | null;
  priority?: TPriority | null;
  quantity?: string | null;
  unit?: TItemUnit | null;
  unitPrice?: number | null;
  actualPrice?: number | null;
  notes?: string | null;
  status?: TItemStatus | null;
  claimedBy?: IGroceryActor | null;
  completedBy?: IGroceryActor | null;
}
