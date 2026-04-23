export type Priority = 'Urgent' | 'Medium' | 'Low';

export type Category = 
  | 'Beauty' 
  | 'Meat' 
  | 'Fish' 
  | 'Vegetables' 
  | 'Fruits' 
  | 'Dairy' 
  | 'Snacks' 
  | 'Drinks' 
  | 'Household' 
  | 'Medicine' 
  | 'Other';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  familyId: string | null;
  role: 'owner' | 'member';
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
  status: 'pending' | 'completed';
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

export type NotificationType = 'item_added' | 'item_completed' | 'urgent_item';

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
