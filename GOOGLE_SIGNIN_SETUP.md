# Google Sign-In Setup

This app now uses `expo-auth-session` for Google account selection and then
signs the user into Firebase with the returned Google token.

## 1. Google Cloud Console

Create or reuse a Google Cloud project.

Enable:

- `Google Identity Services`

Configure the OAuth consent screen:

- Add the app name and support email.
- Add your test users while the app is in testing mode.

Create OAuth client IDs:

1. `Web application`
2. `Android`
3. `iOS`

Use these values:

- Android package name: `com.mehedi.FamilyGroceryList`
- iOS bundle ID: `com.mehedi.FamilyGroceryList`
- For native Google OAuth in Expo, use platform client IDs that match the real app identity instead of a custom redirect URI.
- If you also run the app on web, add your local web origin and redirect URL for that environment separately.

For Android:

- Package name: `com.mehedi.FamilyGroceryList`
- SHA-1: use the signing certificate for the build you run

For iOS:

- Bundle ID: `com.mehedi.FamilyGroceryList`

## 2. Firebase

In Firebase Console:

1. Open `Authentication`.
2. Enable `Google` as a sign-in provider.
3. Make sure the support email is set.

## 3. Environment Variables

Add these to your Expo environment:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
```

If you use `.env`, restart Metro after saving the file.

## 4. Install And Run

```bash
npm install
npx expo start
```

When the user taps `Continue with Google`, the app opens the Google account
chooser. After the user picks an account, the Google token is exchanged with
Firebase Auth and the user document is created in Firestore if needed.

## 5. Success, Cancel, Error States

The app now handles:

- success: Firebase sign-in completes and navigation continues automatically
- cancel/dismiss: loading is cleared with no crash
- error: a readable alert is shown to the user

## 6. Backend Token Verification

This repo does not contain a backend service yet.

Right now, Firebase verifies the Google credential during
`signInWithCredential(...)`, which is secure for Firebase-authenticated apps.

If you later add your own backend, verify the Firebase ID token there instead of
trusting client-side state alone. Typical flow:

1. Client signs in with Google.
2. Client gets Firebase ID token with `auth.currentUser?.getIdToken()`.
3. Client sends that token to your backend over HTTPS.
4. Backend verifies it with Firebase Admin SDK.
5. Backend creates its own session or returns authorized data.
