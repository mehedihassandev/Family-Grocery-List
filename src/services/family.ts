import {
  collection,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { IFamily, IUser } from "../types";

const FIRESTORE_WRITE_TIMEOUT_MS = 15000;
const FIRESTORE_PROBE_TIMEOUT_MS = 8000;

/**
 * Simple 6-character unique code generator
 */
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Wraps a firestore write operation with a timeout
 */
async function withFirestoreWriteTimeout<T>(
  operation: Promise<T>,
  timeoutMessage: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, FIRESTORE_WRITE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Wraps a firestore probe operation with a timeout
 */
async function withProbeTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Firestore availability probe timed out."));
        }, FIRESTORE_PROBE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Probes firestore to check for configuration issues
 */
async function getFirestoreConfigurationIssue(): Promise<string | null> {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    return "Missing Firebase project config in .env";
  }

  const probeUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/families?pageSize=1&key=${apiKey}`;

  try {
    const response = await withProbeTimeout(fetch(probeUrl));
    if (response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      error?: {
        code?: number;
        message?: string;
        status?: string;
        details?: Array<{
          "@type"?: string;
          reason?: string;
          metadata?: {
            activationUrl?: string;
          };
        }>;
      };
    };

    const errorBody = payload.error;
    const details = errorBody?.details ?? [];
    const disabledDetail = details.find((detail) => detail.reason === "SERVICE_DISABLED");
    const activationUrl = disabledDetail?.metadata?.activationUrl;

    if (disabledDetail) {
      return activationUrl
        ? `Cloud Firestore API is disabled. Enable it here: ${activationUrl}`
        : "Cloud Firestore API is disabled for this project.";
    }

    if (
      errorBody?.status === "NOT_FOUND" ||
      (errorBody?.message || "").toLowerCase().includes("database")
    ) {
      return "Cloud Firestore database is not created. Create Firestore Database in Firebase Console.";
    }

    if (errorBody?.message) {
      return errorBody.message;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[FamilyService] Firestore probe failed:", error);
    }
  }

  return null;
}

/**
 * Updates a user's family membership in Firestore
 * @param userId - The user's UID
 * @param familyId - The ID of the family to join
 * @param role - The user's role in the family
 */
const upsertUserFamilyMembership = async (userId: string, familyId: string, role: IUser["role"]) => {
  const userRef = doc(db, "users", userId);
  await withFirestoreWriteTimeout(
    setDoc(
      userRef,
      {
        uid: userId,
        familyId,
        role,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ),
    "User membership write timed out.",
  );
};

/**
 * Creates a new family group
 * @param userId - The ID of the user creating the family (becomes owner)
 * @param familyName - The name of the family group
 */
export const createFamily = async (userId: string, familyName: string) => {
  try {
    const normalizedFamilyName = familyName.trim();
    if (!normalizedFamilyName) {
      throw new Error("Family name is required");
    }

    const inviteCode = generateInviteCode();
    const familyRef = doc(collection(db, "families"));

    const newFamily: IFamily = {
      id: familyRef.id,
      name: normalizedFamilyName,
      inviteCode: inviteCode,
      ownerId: userId,
      createdAt: serverTimestamp(),
    };

    await withFirestoreWriteTimeout(
      setDoc(familyRef, newFamily),
      "Family document write timed out.",
    );

    await upsertUserFamilyMembership(userId, familyRef.id, "owner");

    return newFamily;
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("timed out")) {
      const configIssue = await getFirestoreConfigurationIssue();
      if (configIssue) {
        throw new Error(configIssue);
      }
    }

    console.error("Create Family Error:", error);
    throw error;
  }
};

/**
 * Joins an existing family group via invite code
 * @param userId - The ID of the user joining the family
 * @param inviteCode - The 6-character invite code
 */
export const joinFamily = async (userId: string, inviteCode: string) => {
  try {
    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    if (!normalizedInviteCode) {
      throw new Error("Invite code is required");
    }

    const familiesRef = collection(db, "families");
    const q = query(familiesRef, where("inviteCode", "==", normalizedInviteCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Invalid invite code");
    }

    const familyDoc = querySnapshot.docs[0];
    const familyData = familyDoc.data() as IFamily;

    await upsertUserFamilyMembership(userId, familyData.id, "member");
    return familyData;
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("timed out")) {
      const configIssue = await getFirestoreConfigurationIssue();
      if (configIssue) {
        throw new Error(configIssue);
      }
    }

    console.error("Join Family Error:", error);
    throw error;
  }
};

/**
 * Subscribes to real-time updates for family members
 * @param familyId - The ID of the family
 * @param callback - Function to call with the updated member list
 * @param onError - Optional error handler
 */
export const subscribeToFamilyMembers = (
  familyId: string,
  callback: (members: IUser[]) => void,
  onError?: (error: Error) => void,
) => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("familyId", "==", familyId));

  return onSnapshot(
    q,
    (snapshot) => {
      const members = snapshot.docs.map((doc) => doc.data() as IUser);
      callback(members);
    },
    (error) => {
      console.error("Subscribe Family Members Error:", error);
      onError?.(error);
    },
  );
};

/**
 * Fetches family details by ID
 * @param familyId - The ID of the family
 */
export const getFamilyDetails = async (familyId: string) => {
  const familyRef = doc(db, "families", familyId);
  const familyDoc = await getDoc(familyRef);
  return familyDoc.data() as IFamily;
};

type LeaveFamilyInput = {
  userId: string;
  familyId: string;
  role?: IUser["role"];
};

type LeaveFamilyResult = {
  ownerTransferredTo: string | null;
  familyDeleted: boolean;
};

/**
 * Allows a user to leave their current family
 * Handles owner transfer if the user is the owner
 * @param input - The leave family input parameters
 */
export const leaveFamily = async ({
  userId,
  familyId,
  role,
}: LeaveFamilyInput): Promise<LeaveFamilyResult> => {
  if (!userId) {
    throw new Error("User is required.");
  }

  if (!familyId) {
    throw new Error("Family is required.");
  }

  const userRef = doc(db, "users", userId);
  const familyRef = doc(db, "families", familyId);

  const [familySnapshot, membersSnapshot] = await Promise.all([
    withFirestoreWriteTimeout(getDoc(familyRef), "Family lookup timed out while leaving family."),
    withFirestoreWriteTimeout(
      getDocs(query(collection(db, "users"), where("familyId", "==", familyId))),
      "Family members lookup timed out while leaving family.",
    ),
  ]);

  const familyData = familySnapshot.data() as IFamily | undefined;
  const isOwner = familyData?.ownerId === userId || role === "owner";

  const batch = writeBatch(db);
  batch.update(userRef, {
    familyId: null,
    role: "member",
    updatedAt: serverTimestamp(),
  });

  if (!isOwner) {
    await withFirestoreWriteTimeout(batch.commit(), "Leave family write timed out.");
    return { ownerTransferredTo: null, familyDeleted: false };
  }

  const remainingMembers = membersSnapshot.docs
    .map((memberDoc) => memberDoc.data() as IUser)
    .filter((member) => member.uid !== userId);

  if (remainingMembers.length === 0) {
    if (familySnapshot.exists()) {
      batch.delete(familyRef);
    }
    await withFirestoreWriteTimeout(batch.commit(), "Owner leave write timed out.");
    return { ownerTransferredTo: null, familyDeleted: true };
  }

  const nextOwnerId = remainingMembers[0].uid;
  batch.update(doc(db, "users", nextOwnerId), {
    role: "owner",
    updatedAt: serverTimestamp(),
  });

  if (familySnapshot.exists()) {
    batch.update(familyRef, {
      ownerId: nextOwnerId,
      updatedAt: serverTimestamp(),
    });
  }

  await withFirestoreWriteTimeout(batch.commit(), "Owner transfer write timed out.");

  return { ownerTransferredTo: nextOwnerId, familyDeleted: false };
};

type RemoveMemberAsOwnerInput = {
  ownerId: string;
  familyId: string;
  targetUserId: string;
};

/**
 * Allows a family owner to remove a member from the group
 * @param input - The remove member input parameters
 */
export const removeMemberAsOwner = async ({
  ownerId,
  familyId,
  targetUserId,
}: RemoveMemberAsOwnerInput) => {
  if (!ownerId || !familyId || !targetUserId) {
    throw new Error("Owner, family, and target member are required.");
  }

  if (ownerId === targetUserId) {
    throw new Error("Owner cannot remove themselves. Use leave family.");
  }

  const familyRef = doc(db, "families", familyId);
  const targetUserRef = doc(db, "users", targetUserId);

  const [familySnapshot, targetSnapshot] = await Promise.all([
    withFirestoreWriteTimeout(getDoc(familyRef), "Family lookup timed out while removing member."),
    withFirestoreWriteTimeout(
      getDoc(targetUserRef),
      "Member lookup timed out while removing member.",
    ),
  ]);

  if (!familySnapshot.exists()) {
    throw new Error("Family not found.");
  }

  const family = familySnapshot.data() as IFamily;
  if (family.ownerId !== ownerId) {
    throw new Error("Only owner can remove members.");
  }

  if (!targetSnapshot.exists()) {
    throw new Error("Member not found.");
  }

  const targetUser = targetSnapshot.data() as IUser;
  if (targetUser.familyId !== familyId) {
    throw new Error("Selected user is not in your family.");
  }

  await withFirestoreWriteTimeout(
    updateDoc(targetUserRef, {
      familyId: null,
      role: "member",
      updatedAt: serverTimestamp(),
    }),
    "Remove member write timed out.",
  );
};
