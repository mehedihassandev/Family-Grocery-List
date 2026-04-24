import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { AuthSessionResult } from "expo-auth-session";
import { Platform } from "react-native";
import { FirebaseError } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { useAuthStore } from "../store/useAuthStore";
import { User } from "../types";

WebBrowser.maybeCompleteAuthSession();

type GoogleTokens = {
  accessToken?: string | null;
  idToken?: string | null;
};

type EmailSignInInput = {
  email: string;
  password: string;
};

type EmailSignUpInput = {
  email: string;
  password: string;
  displayName?: string;
};

const googleScopes = ["openid", "profile", "email"];

const googleClientIds = {
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};
const firebaseProjectNumber = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;

type GoogleClientIdKey = keyof typeof googleClientIds;

const googleClientEnvVarMap: Record<GoogleClientIdKey, string> = {
  androidClientId: "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID",
  iosClientId: "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
  webClientId: "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
};

const AUTH_OPERATION_TIMEOUT_MS = 15000;
const AUTH_STORE_KEY = "auth-session-store";
const FIRESTORE_PROFILE_READ_TIMEOUT_MESSAGE =
  "Timed out while reading your profile from Firestore.";
const FIRESTORE_PROFILE_CREATE_TIMEOUT_MESSAGE =
  "Timed out while creating your profile in Firestore.";

type FirebaseProfileUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const mapFirebaseUserToAppUser = (
  firebaseUser: FirebaseProfileUser,
  overrides?: Partial<User>,
): User => ({
  uid: firebaseUser.uid,
  email: overrides?.email ?? firebaseUser.email ?? "",
  displayName: overrides?.displayName ?? firebaseUser.displayName ?? "Anonymous",
  photoURL: overrides?.photoURL ?? firebaseUser.photoURL ?? "",
  familyId: overrides?.familyId ?? null,
  role: overrides?.role === "owner" ? "owner" : "member",
});

const isFirestoreProfileTimeoutError = (error: unknown) =>
  error instanceof Error &&
  (error.message === FIRESTORE_PROFILE_READ_TIMEOUT_MESSAGE ||
    error.message === FIRESTORE_PROFILE_CREATE_TIMEOUT_MESSAGE);

const normalizeEmail = (email: string) => email.trim().toLowerCase();
let activeSignOut: Promise<void> | null = null;
let nativeGoogleSignInConfigured = false;

const configureNativeGoogleSignIn = () => {
  if (Platform.OS === "web" || nativeGoogleSignInConfigured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: googleClientIds.webClientId,
    iosClientId: googleClientIds.iosClientId,
    scopes: googleScopes,
    offlineAccess: false,
  });
  nativeGoogleSignInConfigured = true;
};

const clearPersistedAuthSession = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_STORE_KEY);
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to clear persisted auth session:", error);
    }
  }
};

const getGoogleClientIdForPlatform = () => {
  if (Platform.OS === "ios") {
    return googleClientIds.iosClientId;
  }

  if (Platform.OS === "android") {
    return googleClientIds.androidClientId;
  }

  return googleClientIds.webClientId;
};

const encodeFormBody = (payload: Record<string, string>) =>
  Object.entries(payload)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

const getGoogleRedirectUriOptions = () => {
  if (Platform.OS !== "ios" || !googleClientIds.iosClientId) {
    return {};
  }

  // Google iOS OAuth expects the reverse client-id URL scheme.
  const iosClientIdPrefix = googleClientIds.iosClientId.replace(".apps.googleusercontent.com", "");

  if (!iosClientIdPrefix) {
    return {};
  }

  return {
    native: `com.googleusercontent.apps.${iosClientIdPrefix}:/oauthredirect`,
  };
};

type GoogleConfigStatus = {
  isConfigured: boolean;
  missingEnvVars: string[];
  invalidFormatEnvVars: string[];
  mismatchedProjectEnvVars: string[];
  duplicateClientEnvVars: string[];
};

const getRequiredGoogleClientIdKeysForPlatform = (): GoogleClientIdKey[] => {
  if (Platform.OS === "android") {
    return ["webClientId", "androidClientId"];
  }

  if (Platform.OS === "ios") {
    return ["webClientId", "iosClientId"];
  }

  return ["webClientId"];
};

const getProjectNumberFromGoogleClientId = (clientId: string) => {
  const match = clientId.trim().match(/^(\d+)-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/);
  return match?.[1] ?? null;
};

export const getGoogleSignInConfigurationStatus = (): GoogleConfigStatus => {
  const missingEnvVars: string[] = [];
  const invalidFormatEnvVars: string[] = [];
  const mismatchedProjectEnvVars: string[] = [];
  const duplicateClientEnvVars: string[] = [];

  if (!firebaseProjectNumber) {
    missingEnvVars.push("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  }

  for (const clientIdKey of getRequiredGoogleClientIdKeysForPlatform()) {
    const envVarName = googleClientEnvVarMap[clientIdKey];
    const clientIdValue = googleClientIds[clientIdKey];

    if (!clientIdValue) {
      missingEnvVars.push(envVarName);
      continue;
    }

    const clientProjectNumber = getProjectNumberFromGoogleClientId(clientIdValue);

    if (!clientProjectNumber) {
      invalidFormatEnvVars.push(envVarName);
      continue;
    }

    if (firebaseProjectNumber && clientProjectNumber !== firebaseProjectNumber) {
      mismatchedProjectEnvVars.push(
        `${envVarName} (${clientProjectNumber} != ${firebaseProjectNumber})`,
      );
    }
  }

  if (
    Platform.OS === "android" &&
    googleClientIds.androidClientId &&
    googleClientIds.androidClientId === googleClientIds.webClientId
  ) {
    duplicateClientEnvVars.push(
      "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID must be the Android OAuth client ID, not the Web client ID.",
    );
  }

  if (
    Platform.OS === "ios" &&
    googleClientIds.iosClientId &&
    googleClientIds.iosClientId === googleClientIds.webClientId
  ) {
    duplicateClientEnvVars.push(
      "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must be the iOS OAuth client ID, not the Web client ID.",
    );
  }

  return {
    isConfigured:
      missingEnvVars.length === 0 &&
      invalidFormatEnvVars.length === 0 &&
      mismatchedProjectEnvVars.length === 0 &&
      duplicateClientEnvVars.length === 0,
    missingEnvVars,
    invalidFormatEnvVars,
    mismatchedProjectEnvVars,
    duplicateClientEnvVars,
  };
};

export const hasGoogleSignInConfiguration = () => getGoogleSignInConfigurationStatus().isConfigured;

export const getGoogleSignInSetupMessage = () => {
  const {
    missingEnvVars,
    invalidFormatEnvVars,
    mismatchedProjectEnvVars,
    duplicateClientEnvVars,
  } =
    getGoogleSignInConfigurationStatus();

  if (
    missingEnvVars.length === 0 &&
    invalidFormatEnvVars.length === 0 &&
    mismatchedProjectEnvVars.length === 0 &&
    duplicateClientEnvVars.length === 0
  ) {
    return "Google Sign-In is configured.";
  }

  const issues: string[] = [];

  if (missingEnvVars.length > 0) {
    issues.push(`Missing env vars:\n${missingEnvVars.join("\n")}`);
  }

  if (invalidFormatEnvVars.length > 0) {
    issues.push(`Invalid Google client ID format:\n${invalidFormatEnvVars.join("\n")}`);
  }

  if (mismatchedProjectEnvVars.length > 0) {
    issues.push(
      `Project mismatch (Google client ID project number must match EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID):\n${mismatchedProjectEnvVars.join("\n")}`,
    );
  }

  if (duplicateClientEnvVars.length > 0) {
    issues.push(`Wrong Google client type:\n${duplicateClientEnvVars.join("\n")}`);
  }

  return `Fix Google Sign-In configuration:\n\n${issues.join("\n\n")}`;
};

const createUnavailableGoogleAuthRequest = () =>
  [
    null,
    null,
    async () =>
      ({
        type: "dismiss",
      }) as const,
  ] as const;

const fallbackGoogleClientId = "000000000000-placeholder.apps.googleusercontent.com";

export const useGoogleAuthRequest = () => {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      androidClientId: googleClientIds.androidClientId ?? fallbackGoogleClientId,
      iosClientId: googleClientIds.iosClientId ?? fallbackGoogleClientId,
      webClientId: googleClientIds.webClientId ?? fallbackGoogleClientId,
      scopes: googleScopes,
      selectAccount: true,
      shouldAutoExchangeCode: false,
    },
    getGoogleRedirectUriOptions(),
  );

  if (!hasGoogleSignInConfiguration()) {
    return createUnavailableGoogleAuthRequest();
  }

  return [request, response, promptAsync] as const;
};

const upsertUserProfile = async (firebaseUser: FirebaseProfileUser) => {
  const fallbackUser = mapFirebaseUserToAppUser(firebaseUser);

  try {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await withTimeout(
      getDoc(userDocRef),
      AUTH_OPERATION_TIMEOUT_MS,
      FIRESTORE_PROFILE_READ_TIMEOUT_MESSAGE,
    );

    if (!userDoc.exists()) {
      await withTimeout(
        setDoc(userDocRef, fallbackUser),
        AUTH_OPERATION_TIMEOUT_MS,
        FIRESTORE_PROFILE_CREATE_TIMEOUT_MESSAGE,
      );
      return fallbackUser;
    }

    return mapFirebaseUserToAppUser(firebaseUser, userDoc.data() as Partial<User>);
  } catch (error) {
    if (isFirestoreProfileTimeoutError(error)) {
      return fallbackUser;
    }

    throw error;
  }
};

export const signInWithGoogleTokens = async ({ accessToken, idToken }: GoogleTokens) => {
  const googleCredential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);

  const userCredential = await withTimeout(
    signInWithCredential(auth, googleCredential),
    AUTH_OPERATION_TIMEOUT_MS,
    "Timed out while signing in with Firebase.",
  );

  return mapFirebaseUserToAppUser(userCredential.user);
};

export const signInWithGoogle = async () => {
  if (Platform.OS === "web") {
    throw new Error("Google Sign-In is configured for native Android/iOS builds.");
  }

  if (!googleClientIds.webClientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is required for native Google Sign-In.");
  }

  configureNativeGoogleSignIn();

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await withTimeout(
    GoogleSignin.signIn(),
    AUTH_OPERATION_TIMEOUT_MS,
    "Timed out while opening Google Sign-In.",
  );

  if (response.type === "cancelled") {
    return null;
  }

  let accessToken: string | null = null;
  let idToken = response.data.idToken;

  if (!idToken) {
    const tokens = await withTimeout(
      GoogleSignin.getTokens(),
      AUTH_OPERATION_TIMEOUT_MS,
      "Timed out while reading Google tokens.",
    );
    accessToken = tokens.accessToken;
    idToken = tokens.idToken;
  }

  if (!accessToken && !idToken) {
    throw new Error("Google did not return a usable authentication token.");
  }

  return signInWithGoogleTokens({ accessToken, idToken });
};

export const signInWithEmailCredentials = async ({ email, password }: EmailSignInInput) => {
  const userCredential = await withTimeout(
    firebaseSignInWithEmailAndPassword(auth, normalizeEmail(email), password),
    AUTH_OPERATION_TIMEOUT_MS,
    "Timed out while signing in with email and password.",
  );

  return mapFirebaseUserToAppUser(userCredential.user);
};

export const signUpWithEmailCredentials = async ({
  email,
  password,
  displayName,
}: EmailSignUpInput) => {
  const trimmedDisplayName = displayName?.trim() ?? "";

  const userCredential = await withTimeout(
    createUserWithEmailAndPassword(auth, normalizeEmail(email), password),
    AUTH_OPERATION_TIMEOUT_MS,
    "Timed out while creating your account.",
  );

  if (trimmedDisplayName) {
    await withTimeout(
      updateProfile(userCredential.user, {
        displayName: trimmedDisplayName,
      }),
      AUTH_OPERATION_TIMEOUT_MS,
      "Timed out while saving your account profile.",
    );
  }

  return mapFirebaseUserToAppUser(userCredential.user, {
    displayName: trimmedDisplayName || userCredential.user.displayName || "Anonymous",
  });
};

export const getGoogleTokensFromResponse = (response: AuthSessionResult | null): GoogleTokens => {
  if (response?.type !== "success") {
    return {};
  }

  const params = "params" in response ? response.params : undefined;
  const authentication = "authentication" in response ? response.authentication : undefined;

  return {
    accessToken:
      authentication?.accessToken ??
      (typeof params?.access_token === "string" ? params.access_token : null),
    idToken:
      authentication?.idToken ?? (typeof params?.id_token === "string" ? params.id_token : null),
  };
};

export const getGoogleCodeFromResponse = (response: AuthSessionResult | null) => {
  if (response?.type !== "success") {
    return null;
  }

  const params = "params" in response ? response.params : undefined;
  return typeof params?.code === "string" ? params.code : null;
};

export const exchangeGoogleCodeForTokens = async ({
  code,
  redirectUri,
  codeVerifier,
}: {
  code: string;
  redirectUri?: string;
  codeVerifier?: string;
}): Promise<GoogleTokens> => {
  const clientId = getGoogleClientIdForPlatform();

  if (!clientId) {
    throw new Error("Google client ID is missing for this platform.");
  }

  if (!redirectUri) {
    throw new Error("Google redirect URI is missing.");
  }

  if (!codeVerifier) {
    throw new Error("Google PKCE code verifier is missing.");
  }

  const response = await withTimeout(
    fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: encodeFormBody({
        client_id: clientId,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    }),
    AUTH_OPERATION_TIMEOUT_MS,
    "Timed out while exchanging Google authorization code.",
  );

  let payload: Record<string, unknown> = {};

  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const details =
      typeof payload.error_description === "string"
        ? payload.error_description
        : typeof payload.error === "string"
          ? payload.error
          : `HTTP ${response.status}`;
    throw new Error(`Google token exchange failed: ${details}`);
  }

  return {
    accessToken: typeof payload.access_token === "string" ? payload.access_token : null,
    idToken: typeof payload.id_token === "string" ? payload.id_token : null,
  };
};

export const getGoogleSignInErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);

    if (code === statusCodes.IN_PROGRESS) {
      return "Google Sign-In is already in progress.";
    }

    if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return "Google Play Services is not available or needs an update.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim();

    if (message.includes("auth/invalid-credential") || message.includes("Invalid Idp Response")) {
      return `Google OAuth token audience does not match this Firebase project.\n\n${getGoogleSignInSetupMessage()}`;
    }

    return message;
  }

  return "Unable to continue with Google Sign-In right now.";
};

const isFirebaseAuthError = (error: unknown): error is FirebaseError =>
  error instanceof FirebaseError ||
  (typeof error === "object" && error !== null && "code" in error);

export const getEmailAuthErrorMessage = (error: unknown) => {
  if (isFirebaseAuthError(error)) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/missing-password":
        return "Password is required.";
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Email or password is incorrect.";
      case "auth/email-already-in-use":
        return "This email is already in use.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return error.message || "Unable to continue with email authentication.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unable to continue with email authentication.";
};

export const signOut = async () => {
  if (activeSignOut) {
    await activeSignOut;
    return;
  }

  const { setUser, setLoading } = useAuthStore.getState();
  activeSignOut = (async () => {
    setLoading(true);

    try {
      await withTimeout(
        firebaseSignOut(auth),
        AUTH_OPERATION_TIMEOUT_MS,
        "Timed out while signing out.",
      );
    } catch (error) {
      console.error("Sign-Out Error:", error);
    } finally {
      setUser(null);
      await clearPersistedAuthSession();
      setLoading(false);
    }
  })();

  try {
    await activeSignOut;
  } finally {
    activeSignOut = null;
  }
};

export const listenToAuthChanges = () => {
  const { setUser, setLoading } = useAuthStore.getState();
  let authEventVersion = 0;

  return onAuthStateChanged(auth, async (firebaseUser) => {
    const currentEventVersion = ++authEventVersion;

    try {
      if (firebaseUser) {
        // Never block UI on Firestore; show fallback user immediately.
        setUser(mapFirebaseUserToAppUser(firebaseUser));

        const user = await upsertUserProfile(firebaseUser);

        // Avoid stale async writes overriding a newer auth state (e.g. logout).
        if (
          currentEventVersion !== authEventVersion ||
          auth.currentUser?.uid !== firebaseUser.uid
        ) {
          return;
        }

        setUser(user);
      } else {
        setUser(null);
        await clearPersistedAuthSession();
      }
    } catch (error) {
      if (__DEV__) {
        console.warn("Auth State Sync Warning:", error);
      }

      if (
        firebaseUser &&
        currentEventVersion === authEventVersion &&
        auth.currentUser?.uid === firebaseUser.uid
      ) {
        setUser(mapFirebaseUserToAppUser(firebaseUser));
      } else {
        setUser(null);
        await clearPersistedAuthSession();
      }
    } finally {
      if (currentEventVersion === authEventVersion) {
        setLoading(false);
      }
    }
  });
};
