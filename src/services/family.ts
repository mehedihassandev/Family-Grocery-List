import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { Family, User } from "../types";

const FIRESTORE_WRITE_TIMEOUT_MS = 15000;
const FIRESTORE_PROBE_TIMEOUT_MS = 8000;

// Simple 6-character unique code generator
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

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
    const disabledDetail = details.find(
      (detail) => detail.reason === "SERVICE_DISABLED",
    );
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

const upsertUserFamilyMembership = async (
  userId: string,
  familyId: string,
  role: User["role"],
) => {
  console.log("[FamilyService] membership:write:start", {
    userId,
    familyId,
    role,
  });
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
  console.log("[FamilyService] membership:write:success", {
    userId,
    familyId,
    role,
  });
};

export const createFamily = async (userId: string, familyName: string) => {
  try {
    const normalizedFamilyName = familyName.trim();
    if (!normalizedFamilyName) {
      throw new Error("Family name is required");
    }

    const inviteCode = generateInviteCode();
    const familyRef = doc(collection(db, "families"));

    const newFamily: Family = {
      id: familyRef.id,
      name: normalizedFamilyName,
      inviteCode: inviteCode,
      ownerId: userId,
      createdAt: serverTimestamp(),
    };

    console.log("[FamilyService] createFamily:familyDoc:start", {
      userId,
      familyId: familyRef.id,
    });
    await withFirestoreWriteTimeout(
      setDoc(familyRef, newFamily),
      "Family document write timed out.",
    );
    console.log("[FamilyService] createFamily:familyDoc:success", {
      userId,
      familyId: familyRef.id,
    });

    await upsertUserFamilyMembership(userId, familyRef.id, "owner");

    return newFamily;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("timed out")
    ) {
      const configIssue = await getFirestoreConfigurationIssue();
      if (configIssue) {
        throw new Error(configIssue);
      }
    }

    console.error("Create Family Error:", error);
    throw error;
  }
};

export const joinFamily = async (userId: string, inviteCode: string) => {
  try {
    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    if (!normalizedInviteCode) {
      throw new Error("Invite code is required");
    }

    const familiesRef = collection(db, "families");
    console.log("[FamilyService] joinFamily:lookup:start", {
      userId,
      inviteCode: normalizedInviteCode,
    });
    const q = query(
      familiesRef,
      where("inviteCode", "==", normalizedInviteCode),
    );
    const querySnapshot = await getDocs(q);
    console.log("[FamilyService] joinFamily:lookup:success", {
      userId,
      inviteCode: normalizedInviteCode,
      count: querySnapshot.size,
    });

    if (querySnapshot.empty) {
      throw new Error("Invalid invite code");
    }

    const familyDoc = querySnapshot.docs[0];
    const familyData = familyDoc.data() as Family;

    await upsertUserFamilyMembership(userId, familyData.id, "member");
    return familyData;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("timed out")
    ) {
      const configIssue = await getFirestoreConfigurationIssue();
      if (configIssue) {
        throw new Error(configIssue);
      }
    }

    console.error("Join Family Error:", error);
    throw error;
  }
};

export const subscribeToFamilyMembers = (
  familyId: string,
  callback: (members: User[]) => void,
  onError?: (error: Error) => void,
) => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("familyId", "==", familyId));

  return onSnapshot(
    q,
    (snapshot) => {
      const members = snapshot.docs.map((doc) => doc.data() as User);
      callback(members);
    },
    (error) => {
      console.error("Subscribe Family Members Error:", error);
      onError?.(error);
    },
  );
};

export const getFamilyDetails = async (familyId: string) => {
  const familyRef = doc(db, "families", familyId);
  const familyDoc = await getDoc(familyRef);
  return familyDoc.data() as Family;
};
