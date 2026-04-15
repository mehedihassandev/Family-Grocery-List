import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface CustomCategory {
    id: string;
    familyId: string;
    name: string;
}

export const addCustomCategory = async (familyId: string, name: string) => {
    try {
        const catRef = doc(collection(db, 'categories'));
        const newCat: CustomCategory = {
            id: catRef.id,
            familyId,
            name,
        };
        await setDoc(catRef, newCat);
        return newCat;
    } catch (error) {
        console.error('Add Category Error:', error);
        throw error;
    }
};

export const subscribeToCategories = (familyId: string, callback: (categories: CustomCategory[]) => void) => {
    const catsRef = collection(db, 'categories');
    const q = query(catsRef, where('familyId', '==', familyId));

    return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs.map(doc => doc.data() as CustomCategory);
        callback(categories);
    });
};
