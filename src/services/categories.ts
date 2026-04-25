import { collection, doc, setDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";

export interface ICustomCategory {
  id: string;
  familyId: string;
  name: string;
}

/**
 * Adds a new custom category to a family's list
 * Why: To allow families to organize items beyond the default preset categories.
 * @param familyId - The ID of the family group
 * @param name - The name of the new category
 * @returns The newly created custom category object
 */
export const addCustomCategory = async (familyId: string, name: string): Promise<ICustomCategory> => {
  try {
    const catRef = doc(collection(db, "categories"));
    const newCat: ICustomCategory = {
      id: catRef.id,
      familyId,
      name,
    };
    await setDoc(catRef, newCat);
    return newCat;
  } catch (error) {
    console.error("Add Category Error:", error);
    throw error;
  }
};

/**
 * Subscribes to real-time updates for a family's custom categories
 * Why: To ensure the category selection UI is always in sync with family changes.
 * @param familyId - The ID of the family group
 * @param callback - Function to handle the list of categories on every update
 * @returns An unsubscribe function
 */
export const subscribeToCategories = (
  familyId: string,
  callback: (categories: ICustomCategory[]) => void,
) => {
  const catsRef = collection(db, "categories");
  const q = query(catsRef, where("familyId", "==", familyId));

  return onSnapshot(
    q,
    (snapshot) => {
      const categories = snapshot.docs.map((doc) => doc.data() as ICustomCategory);
      callback(categories);
    },
    (error) => {
      console.error("Subscribe Categories Error:", error);
    },
  );
};
