import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  writeBatch,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { IFamily, IUser } from "../types";
import { normalizeInviteCode, trimText } from "../utils";
import { planOwnerExit } from "./familyPlan";

const FIRESTORE_WRITE_TIMEOUT_MS = 15000;
const FIRESTORE_READ_TIMEOUT_MS = 12000;
const FIRESTORE_PROBE_TIMEOUT_MS = 8000;
const FAMILY_INVITES_COLLECTION = "family_invites";
const INVITE_CODE_MAX_GENERATION_ATTEMPTS = 12;
const INVITE_CODE_ALREADY_EXISTS_ERROR = "INVITE_CODE_ALREADY_EXISTS";

/**
 * Simple 6-character unique code generator
 */
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const getFamilyInviteRef = (inviteCode: string) =>
  doc(db, FAMILY_INVITES_COLLECTION, normalizeInviteCode(inviteCode));

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
 * Wraps a firestore read operation with a timeout
 */
async function withFirestoreReadTimeout<T>(
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
        }, FIRESTORE_READ_TIMEOUT_MS);
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
        details?: {
          "@type"?: string;
          reason?: string;
          metadata?: {
            activationUrl?: string;
          };
        }[];
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
const upsertUserFamilyMembership = async (
  userId: string,
  familyId: string,
  role: IUser["role"],
  inviteCode?: string,
) => {
  const userRef = doc(db, "users", userId);
  const normalizedInviteCode = inviteCode ? normalizeInviteCode(inviteCode) : "";
  await withFirestoreWriteTimeout(
    setDoc(
      userRef,
      {
        uid: userId,
        familyId,
        role,
        lastInviteCode: normalizedInviteCode,
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
    const normalizedFamilyName = trimText(familyName);
    if (!normalizedFamilyName) {
      throw new Error("Family name is required");
    }

    for (let attempt = 0; attempt < INVITE_CODE_MAX_GENERATION_ATTEMPTS; attempt += 1) {
      const inviteCode = generateInviteCode();
      const familyRef = doc(collection(db, "families"));
      const userRef = doc(db, "users", userId);
      const inviteRef = getFamilyInviteRef(inviteCode);

      const newFamily: IFamily = {
        id: familyRef.id,
        name: normalizedFamilyName,
        inviteCode,
        ownerId: userId,
        createdAt: serverTimestamp(),
      };

      try {
        await withFirestoreWriteTimeout(
          runTransaction(db, async (transaction) => {
            const inviteSnapshot = await transaction.get(inviteRef);
            if (inviteSnapshot.exists()) {
              throw new Error(INVITE_CODE_ALREADY_EXISTS_ERROR);
            }

            transaction.set(familyRef, newFamily);
            transaction.set(inviteRef, {
              code: inviteCode,
              familyId: familyRef.id,
              familyName: normalizedFamilyName,
              ownerId: userId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            transaction.set(
              userRef,
              {
                uid: userId,
                familyId: familyRef.id,
                role: "owner",
                lastInviteCode: inviteCode,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          }),
          "Family setup write timed out.",
        );

        return newFamily;
      } catch (error) {
        if (error instanceof Error && error.message === INVITE_CODE_ALREADY_EXISTS_ERROR) {
          continue;
        }
        throw error;
      }
    }

    throw new Error("Could not generate a unique invite code. Please try again.");
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
    const normalizedInviteCode = normalizeInviteCode(inviteCode);
    if (!normalizedInviteCode) {
      throw new Error("Invite code is required");
    }

    const inviteSnapshot = await withFirestoreReadTimeout(
      getDoc(getFamilyInviteRef(normalizedInviteCode)),
      "Invite lookup timed out.",
    );
    let familyId = "";

    if (inviteSnapshot.exists()) {
      const inviteData = inviteSnapshot.data() as { familyId?: string };
      familyId = trimText(inviteData.familyId);
    }

    if (!familyId) {
      throw new Error(
        "Invalid invite code. Ask family owner to open app once (owner account) and re-share invite code. If still failing, deploy latest Firestore rules.",
      );
    }

    await upsertUserFamilyMembership(userId, familyId, "member", normalizedInviteCode);

    const familySnapshot = await withFirestoreReadTimeout(
      getDoc(doc(db, "families", familyId)),
      "Family lookup timed out.",
    );
    if (!familySnapshot.exists()) {
      throw new Error("Family is no longer available.");
    }

    return familySnapshot.data() as IFamily;
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
 * Ensures a family's invite-code index document exists and is up to date.
 * Useful for migrating older family docs that were created before family_invites.
 */
export const syncFamilyInviteForOwner = async (familyId: string, ownerId: string) => {
  if (!familyId || !ownerId) {
    return;
  }

  const familyRef = doc(db, "families", familyId);
  const familySnapshot = await getDoc(familyRef);
  if (!familySnapshot.exists()) {
    return;
  }

  const familyData = familySnapshot.data() as IFamily;
  if (familyData.ownerId !== ownerId) {
    return;
  }

  const normalizedInviteCode = normalizeInviteCode(familyData.inviteCode);
  if (!normalizedInviteCode) {
    return;
  }

  await setDoc(
    getFamilyInviteRef(normalizedInviteCode),
    {
      code: normalizedInviteCode,
      familyId,
      familyName: familyData.name ?? "",
      ownerId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
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
  if (!familyDoc.exists()) {
    return null;
  }

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
}: LeaveFamilyInput): Promise<LeaveFamilyResult> => {
  if (!userId) {
    throw new Error("User is required.");
  }

  if (!familyId) {
    throw new Error("Family is required.");
  }

  const userRef = doc(db, "users", userId);
  const familyRef = doc(db, "families", familyId);

  let familySnapshot;
  try {
    familySnapshot = await withFirestoreWriteTimeout(
      getDoc(familyRef),
      "Family lookup timed out while leaving family.",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Leave step failed at family lookup: ${message}`);
  }

  const familyData = familySnapshot.data() as IFamily | undefined;
  const isOwner = familyData?.ownerId === userId;

  const batch = writeBatch(db);
  batch.update(userRef, {
    familyId: null,
    role: "member",
    updatedAt: serverTimestamp(),
  });

  if (!isOwner) {
    try {
      await withFirestoreWriteTimeout(batch.commit(), "Leave family write timed out.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Leave step failed at self-leave commit: ${message}`);
    }
    return { ownerTransferredTo: null, familyDeleted: false };
  }

  let membersSnapshot;
  try {
    membersSnapshot = await withFirestoreWriteTimeout(
      getDocs(query(collection(db, "users"), where("familyId", "==", familyId))),
      "Family members lookup timed out while leaving family.",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Leave step failed at members lookup: ${message}`);
  }

  const memberList = membersSnapshot.docs.map((memberDoc) => memberDoc.data() as IUser);
  const ownerExitPlan = planOwnerExit(userId, memberList);

  if (ownerExitPlan.shouldDeleteFamily) {
    if (familySnapshot.exists()) {
      batch.delete(familyRef);
      if (familyData?.inviteCode) {
        batch.delete(getFamilyInviteRef(familyData.inviteCode));
      }
    }
    try {
      await withFirestoreWriteTimeout(batch.commit(), "Owner leave write timed out.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Leave step failed at owner-delete commit: ${message}`);
    }
    return { ownerTransferredTo: null, familyDeleted: true };
  }

  const nextOwnerId = ownerExitPlan.nextOwnerId;
  if (!nextOwnerId) {
    throw new Error("Could not determine next owner.");
  }
  batch.update(doc(db, "users", nextOwnerId), {
    role: "owner",
    updatedAt: serverTimestamp(),
  });

  if (familySnapshot.exists()) {
    batch.update(familyRef, {
      ownerId: nextOwnerId,
      updatedAt: serverTimestamp(),
    });
    if (familyData?.inviteCode) {
      batch.set(
        getFamilyInviteRef(familyData.inviteCode),
        {
          ownerId: nextOwnerId,
          familyId,
          familyName: familyData.name ?? "",
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  }

  try {
    await withFirestoreWriteTimeout(batch.commit(), "Owner transfer write timed out.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Leave step failed at owner-transfer commit: ${message}`);
  }

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
