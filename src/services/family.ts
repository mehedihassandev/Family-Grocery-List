import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Family, User } from '../types';

// Simple 6-character unique code generator
const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createFamily = async (userId: string, familyName: string) => {
    try {
        const inviteCode = generateInviteCode();
        const familyRef = doc(collection(db, 'families'));
        
        const newFamily: Family = {
            id: familyRef.id,
            name: familyName,
            inviteCode: inviteCode,
            ownerId: userId,
            createdAt: serverTimestamp(),
        };

        await setDoc(familyRef, newFamily);

        // Update user with familyId and role
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            familyId: familyRef.id,
            role: 'owner'
        });

        return newFamily;
    } catch (error) {
        console.error('Create Family Error:', error);
        throw error;
    }
};

export const joinFamily = async (userId: string, inviteCode: string) => {
    try {
        const familiesRef = collection(db, 'families');
        const q = query(familiesRef, where('inviteCode', '==', inviteCode.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error('Invalid invite code');
        }

        const familyDoc = querySnapshot.docs[0];
        const familyData = familyDoc.data() as Family;

        // Update user with familyId
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            familyId: familyData.id,
            role: 'member'
        });
        return familyData;
    } catch (error) {
        console.error('Join Family Error:', error);
        throw error;
    }
};

export const subscribeToFamilyMembers = (familyId: string, callback: (members: User[]) => void) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('familyId', '==', familyId));

    return onSnapshot(q, (snapshot) => {
        const members = snapshot.docs.map(doc => doc.data() as User);
        callback(members);
    });
};

export const getFamilyDetails = async (familyId: string) => {
    const familyRef = doc(db, 'families', familyId);
    const familyDoc = await getDoc(familyRef);
    return familyDoc.data() as Family;
};
