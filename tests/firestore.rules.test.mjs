import fs from "node:fs";
import { before, beforeEach, after, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  collection,
  where,
  limit,
  getDocs,
} from "firebase/firestore";

const PROJECT_ID = "demo-family-grocery-list";
const FIRESTORE_HOST = "127.0.0.1";
const FIRESTORE_PORT = 8080;

const OWNER_ID = "owner-1";
const MEMBER_ID = "member-1";
const OTHER_MEMBER_ID = "other-member-1";
const OUTSIDER_ID = "outsider-1";

let testEnv;

const authDb = (uid) => testEnv.authenticatedContext(uid).firestore();

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: FIRESTORE_HOST,
      port: FIRESTORE_PORT,
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "families", "fam-1"), {
      id: "fam-1",
      name: "Family One",
      inviteCode: "AB12CD",
      ownerId: OWNER_ID,
      createdAt: 1,
    });

    await setDoc(doc(db, "families", "fam-2"), {
      id: "fam-2",
      name: "Family Two",
      inviteCode: "ZX98CV",
      ownerId: "owner-2",
      createdAt: 1,
    });

    await setDoc(doc(db, "users", OWNER_ID), {
      uid: OWNER_ID,
      email: "owner@example.com",
      displayName: "Owner",
      photoURL: "",
      familyId: "fam-1",
      role: "owner",
      updatedAt: 1,
    });

    await setDoc(doc(db, "users", MEMBER_ID), {
      uid: MEMBER_ID,
      email: "member@example.com",
      displayName: "Member",
      photoURL: "",
      familyId: "fam-1",
      role: "member",
      updatedAt: 1,
    });

    await setDoc(doc(db, "users", OTHER_MEMBER_ID), {
      uid: OTHER_MEMBER_ID,
      email: "other@example.com",
      displayName: "Other",
      photoURL: "",
      familyId: "fam-1",
      role: "member",
      updatedAt: 1,
    });

    await setDoc(doc(db, "users", OUTSIDER_ID), {
      uid: OUTSIDER_ID,
      email: "outsider@example.com",
      displayName: "Outsider",
      photoURL: "",
      familyId: "fam-2",
      role: "member",
      updatedAt: 1,
    });

    await setDoc(doc(db, "grocery_items", "item-1"), {
      id: "item-1",
      familyId: "fam-1",
      name: "Milk",
      category: "Dairy",
      priority: "Medium",
      quantity: "1",
      notes: "",
      status: "pending",
      addedBy: { uid: OWNER_ID, name: "Owner" },
      completedBy: null,
      createdAt: 1,
      updatedAt: 1,
      completedAt: null,
    });

    await setDoc(doc(db, "notifications", "notif-1"), {
      id: "notif-1",
      familyId: "fam-1",
      type: "item_added",
      title: "New Item Added",
      message: "Owner added Milk",
      actorId: OWNER_ID,
      actorName: "Owner",
      itemId: "item-1",
      itemName: "Milk",
      readBy: [],
      createdAt: 1,
    });
  });
});

after(async () => {
  await testEnv.cleanup();
});

describe("firestore.rules authz matrix", () => {
  test("unauthenticated user cannot read family doc", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(unauthDb, "families", "fam-1")));
  });

  test("family member can read own family doc", async () => {
    await assertSucceeds(getDoc(doc(authDb(MEMBER_ID), "families", "fam-1")));
  });

  test("outsider cannot read other family doc directly", async () => {
    await assertFails(getDoc(doc(authDb(OUTSIDER_ID), "families", "fam-1")));
  });

  test("invite code lookup requires query limit <= 1", async () => {
    const memberDb = authDb(MEMBER_ID);

    await assertSucceeds(
      getDocs(query(collection(memberDb, "families"), where("inviteCode", "==", "AB12CD"), limit(1))),
    );

    await assertFails(
      getDocs(query(collection(memberDb, "families"), where("inviteCode", "==", "AB12CD"), limit(2))),
    );
  });

  test("user cannot self-escalate role/family", async () => {
    await assertFails(
      updateDoc(doc(authDb(MEMBER_ID), "users", MEMBER_ID), {
        familyId: "fam-2",
        role: "owner",
      }),
    );
  });

  test("user can update own displayName", async () => {
    await assertSucceeds(
      updateDoc(doc(authDb(MEMBER_ID), "users", MEMBER_ID), {
        displayName: "Member Updated",
      }),
    );
  });

  test("non-owner cannot remove member", async () => {
    await assertFails(
      updateDoc(doc(authDb(MEMBER_ID), "users", OTHER_MEMBER_ID), {
        familyId: null,
        role: "member",
        updatedAt: 2,
      }),
    );
  });

  test("owner can remove member", async () => {
    await assertSucceeds(
      updateDoc(doc(authDb(OWNER_ID), "users", OTHER_MEMBER_ID), {
        familyId: null,
        role: "member",
        updatedAt: 2,
      }),
    );
  });

  test("member cannot move grocery item to another family", async () => {
    await assertFails(
      updateDoc(doc(authDb(MEMBER_ID), "grocery_items", "item-1"), {
        familyId: "fam-2",
      }),
    );
  });

  test("member can edit grocery fields within same family", async () => {
    await assertSucceeds(
      updateDoc(doc(authDb(MEMBER_ID), "grocery_items", "item-1"), {
        notes: "2L carton",
      }),
    );
  });

  test("member cannot spoof notification readBy for another uid", async () => {
    await assertFails(
      updateDoc(doc(authDb(MEMBER_ID), "notifications", "notif-1"), {
        readBy: [OUTSIDER_ID],
      }),
    );
  });

  test("member can mark notification as read for self", async () => {
    await assertSucceeds(
      updateDoc(doc(authDb(MEMBER_ID), "notifications", "notif-1"), {
        readBy: [MEMBER_ID],
      }),
    );
  });
});
