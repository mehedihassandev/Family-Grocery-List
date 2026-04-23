# Firestore Rules Setup

Use this when you see:

- `Missing or insufficient permissions`
- `permission-denied` while remove member / leave family

## 1. Open Firestore Rules

1. Go to Firebase Console
2. Open project: `family-grocery-list-118d2`
3. Firestore Database -> Rules

## 2. Paste Rules

1. Open [`firestore.rules`](./firestore.rules)
2. Copy all content
3. Paste in Firestore Rules editor
4. Click **Publish**

## 3. Verify In App

1. Owner account -> Members -> Remove any non-owner user
2. Member account -> Profile -> Leave Family
3. Owner account -> Profile -> Leave Family (owner transfer should happen if members exist)

## 4. If it still fails

1. Confirm app is logged into the same Firebase project as rules.
2. Wait 20-60 seconds after publishing rules, then retry.
3. Restart app (`npm run start:clear`).
