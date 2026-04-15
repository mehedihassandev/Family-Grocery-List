import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { GroceryItem, Priority } from '../types';

export const addGroceryItem = async (
  familyId: string, 
  item: Partial<GroceryItem>, 
  user: { uid: string, name: string }
) => {
  try {
    const itemRef = doc(collection(db, 'grocery_items'));
    const newItem: GroceryItem = {
      id: itemRef.id,
      familyId,
      name: item.name || '',
      category: item.category || 'Other',
      priority: item.priority || 'Medium',
      notes: item.notes || '',
      quantity: item.quantity || '',
      status: 'pending',
      addedBy: user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(itemRef, newItem);
    return newItem;
  } catch (error) {
    console.error('Add Item Error:', error);
    throw error;
  }
};

export const updateGroceryItem = async (itemId: string, updates: Partial<GroceryItem>) => {
  try {
    const itemRef = doc(db, 'grocery_items', itemId);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Update Item Error:', error);
    throw error;
  }
};

export const toggleItemCompletion = async (
  itemId: string, 
  currentStatus: 'pending' | 'completed',
  user: { uid: string, name: string }
) => {
  try {
    const itemRef = doc(db, 'grocery_items', itemId);
    const isCompleting = currentStatus === 'pending';
    
    await updateDoc(itemRef, {
      status: isCompleting ? 'completed' : 'pending',
      completedBy: isCompleting ? user : null,
      completedAt: isCompleting ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Toggle Completion Error:', error);
    throw error;
  }
};

export const deleteGroceryItem = async (itemId: string) => {
  try {
    const itemRef = doc(db, 'grocery_items', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error('Delete Item Error:', error);
    throw error;
  }
};

export const subscribeToGroceryList = (familyId: string, callback: (items: GroceryItem[]) => void) => {
  const itemsRef = collection(db, 'grocery_items');
  const q = query(
    itemsRef, 
    where('familyId', '==', familyId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => doc.data() as GroceryItem);
    callback(items);
  });
};
