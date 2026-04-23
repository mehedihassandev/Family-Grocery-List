import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { AppNotification, NotificationType } from "../types";

export const createNotification = async (
  familyId: string,
  type: NotificationType,
  message: string,
  actor: { uid: string; name: string },
  itemDetails: { id: string; name: string },
) => {
  try {
    const notifRef = doc(collection(db, "notifications"));

    let title = "Update";
    if (type === "item_added") title = "New Item Added";
    if (type === "item_completed") title = "Item Completed";
    if (type === "urgent_item") title = "Urgent Request";

    const newNotif: AppNotification = {
      id: notifRef.id,
      familyId,
      type,
      title,
      message,
      actorId: actor.uid,
      actorName: actor.name,
      itemId: itemDetails.id,
      itemName: itemDetails.name,
      readBy: [],
      createdAt: serverTimestamp(),
    };

    await setDoc(notifRef, newNotif);
    return newNotif;
  } catch (error) {
    console.error("Create Notification Error:", error);
  }
};

export const subscribeToNotifications = (
  familyId: string,
  callback: (notifications: AppNotification[]) => void,
  onError?: (error: Error) => void,
) => {
  const notifRef = collection(db, "notifications");
  const q = query(notifRef, where("familyId", "==", familyId));

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => doc.data() as AppNotification);
      // Sort in memory (since we don't want to enforce a composite index on familyId + createdAt right away)
      const sorted = notifications.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      callback(sorted);
    },
    (error) => {
      console.error("Subscribe Notifications Error:", error);
      onError?.(error);
    },
  );
};

export const markNotificationsAsRead = async (notificationIds: string[], userId: string) => {
  if (!notificationIds.length || !userId) return;

  try {
    const batch = writeBatch(db);

    notificationIds.forEach((id) => {
      const notifRef = doc(db, "notifications", id);
      batch.update(notifRef, {
        readBy: arrayUnion(userId),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error("Mark Read Error:", error);
  }
};
