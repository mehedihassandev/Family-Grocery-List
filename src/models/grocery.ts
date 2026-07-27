export type TPriority = "Urgent" | "High" | "Medium" | "Low";
export type TItemStatus = "pending" | "completed";

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
  notes?: string | null;
  status: TItemStatus;
  addedBy?: IGroceryActor | null;
  completedBy?: IGroceryActor | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  completedAt?: string | Date | null;

  // Extended app fields for UI compatibility
  recurrenceFrequency?: string | null;
  assignee?: IGroceryActor | null;
  dueDate?: string | Date | null;
  reminderAt?: string | Date | null;
  unitPrice?: number | null;
  estimatedTotal?: number | null;
}

export interface IGrocerySummary {
  familyId: string;
  totalItems: number;
  pendingItems: number;
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
  notes?: string | null;
}

export interface IUpdateGroceryItemRequest {
  name?: string | null;
  category?: string | null;
  priority?: TPriority | null;
  quantity?: string | null;
  notes?: string | null;
  status?: TItemStatus | null;
}
