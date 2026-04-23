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
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { GroceryItem, Priority } from "../types";
import { createNotification } from "./notification";

export const addGroceryItem = async (
  familyId: string,
  item: Partial<GroceryItem>,
  user: { uid: string; name: string },
) => {
  try {
    const itemRef = doc(collection(db, "grocery_items"));
    const newItem: GroceryItem = {
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
    await createNotification(
      familyId,
      newItem.priority === "Urgent" ? "urgent_item" : "item_added",
      `${user.name} added ${newItem.name}`,
      user,
      { id: newItem.id, name: newItem.name },
    );

    return newItem;
  } catch (error) {
    console.error("Add Item Error:", error);
    throw error;
  }
};

export const updateGroceryItem = async (itemId: string, updates: Partial<GroceryItem>) => {
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
      await createNotification(
        item.familyId,
        "item_completed",
        `${user.name} checked off ${item.name}`,
        user,
        { id: item.id, name: item.name },
      );
    }
  } catch (error) {
    console.error("Toggle Completion Error:", error);
    throw error;
  }
};

export const deleteGroceryItem = async (itemId: string) => {
  try {
    const itemRef = doc(db, "grocery_items", itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error("Delete Item Error:", error);
    throw error;
  }
};

export const subscribeToGroceryList = (
  familyId: string,
  callback: (items: GroceryItem[]) => void,
  onError?: (error: Error) => void,
) => {
  const itemsRef = collection(db, "grocery_items");
  const q = query(itemsRef, where("familyId", "==", familyId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => doc.data() as GroceryItem);
      callback(items);
    },
    (error) => {
      console.error("Subscribe Grocery List Error:", error);
      onError?.(error);
    },
  );
};
