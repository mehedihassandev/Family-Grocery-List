import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { IGroceryItem } from "../types";
import { createNotification } from "./notification";

/**
 * Fetches a single grocery item by its ID
 * @param itemId - The ID of the item to fetch
 */
export const getGroceryItem = async (itemId: string): Promise<IGroceryItem | null> => {
  try {
    const itemRef = doc(db, "grocery_items", itemId);
    const itemSnap = await getDoc(itemRef);
    if (itemSnap.exists()) {
      return itemSnap.data() as IGroceryItem;
    }
    return null;
  } catch (error) {
    console.error("Get Grocery Item Error:", error);
    throw error;
  }
};

/**
 * Adds a new grocery item to the family list
 * @param familyId - The ID of the family
 * @param item - The partial item data
 * @param user - The user adding the item
 */
export const addGroceryItem = async (
  familyId: string,
  item: Partial<IGroceryItem>,
  user: { uid: string; name: string },
) => {
  try {
    const itemRef = doc(collection(db, "grocery_items"));
    const newItem: IGroceryItem = {
      id: itemRef.id,
      familyId,
      name: item.name || "",
      category: item.category || "Other",
      priority: item.priority || "Medium",
      notes: item.notes || "",
      quantity: item.quantity || "",
      status: "pending",
      addedBy: user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(itemRef, newItem);

    // Create an "item_added" notification (or "urgent_item" if priority is Urgent)
    try {
      await createNotification(
        familyId,
        newItem.priority === "Urgent" ? "urgent_item" : "item_added",
        `${user.name} added ${newItem.name}`,
        user,
        { id: newItem.id, name: newItem.name },
      );
    } catch (error) {
      console.warn("Item added but notification creation failed:", error);
    }

    return newItem;
  } catch (error) {
    console.error("Add Item Error:", error);
    throw error;
  }
};

/**
 * Updates an existing grocery item
 * @param itemId - The ID of the item to update
 * @param updates - The partial updates to apply
 */
export const updateGroceryItem = async (itemId: string, updates: Partial<IGroceryItem>) => {
  try {
    const itemRef = doc(db, "grocery_items", itemId);
    await updateDoc(itemRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Update Item Error:", error);
    throw error;
  }
};

/**
 * Toggles the completion status of a grocery item
 * @param item - The item to toggle
 * @param user - The user toggling the status
 */
export const toggleItemCompletion = async (
  item: { id: string; name: string; status: "pending" | "completed"; familyId: string },
  user: { uid: string; name: string },
) => {
  try {
    const itemRef = doc(db, "grocery_items", item.id);
    const isCompleting = item.status === "pending";

    await updateDoc(itemRef, {
      status: isCompleting ? "completed" : "pending",
      completedBy: isCompleting ? user : null,
      completedAt: isCompleting ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });

    if (isCompleting) {
      try {
        await createNotification(
          item.familyId,
          "item_completed",
          `${user.name} checked off ${item.name}`,
          user,
          { id: item.id, name: item.name },
        );
      } catch (error) {
        console.warn("Item completion updated but notification creation failed:", error);
      }
    }
  } catch (error) {
    console.error("Toggle Completion Error:", error);
    throw error;
  }
};

/**
 * Deletes a grocery item from the list
 * @param itemId - The ID of the item to delete
 */
export const deleteGroceryItem = async (itemId: string) => {
  try {
    const itemRef = doc(db, "grocery_items", itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error("Delete Item Error:", error);
    throw error;
  }
};

/**
 * Subscribes to real-time updates for the family grocery list
 * @param familyId - The ID of the family
 * @param callback - Function to call with the updated list
 * @param onError - Optional error handler
 */
export const subscribeToGroceryList = (
  familyId: string,
  callback: (items: IGroceryItem[]) => void,
  onError?: (error: Error) => void,
) => {
  const itemsRef = collection(db, "grocery_items");
  const q = query(itemsRef, where("familyId", "==", familyId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => doc.data() as IGroceryItem);
      callback(items);
    },
    (error) => {
      console.error("Subscribe Grocery List Error:", error);
      onError?.(error);
    },
  );
};
