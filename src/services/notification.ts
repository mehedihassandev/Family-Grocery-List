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
import { IAppNotification, NotificationType } from "../types";

/**
 * Creates a new activity notification in Firestore
 * @param familyId - The ID of the family
 * @param type - The type of notification
 * @param message - The notification message
 * @param actor - The user performing the action
 * @param itemDetails - The details of the grocery item involved
 */
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

    const newNotif: IAppNotification = {
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

/**
 * Subscribes to real-time notifications for the family
 * @param familyId - The ID of the family
 * @param callback - Function to call with the updated notification list
 * @param onError - Optional error handler
 */
export const subscribeToNotifications = (
  familyId: string,
  callback: (notifications: IAppNotification[]) => void,
  onError?: (error: Error) => void,
) => {
  const notifRef = collection(db, "notifications");
  const q = query(notifRef, where("familyId", "==", familyId));

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => doc.data() as IAppNotification);
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

/**
 * Marks a list of notifications as read by a user
 * @param notificationIds - The IDs of the notifications to mark as read
 * @param userId - The ID of the user reading the notifications
 */
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
