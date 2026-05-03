import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { AuthSessionResult } from "expo-auth-session";
import { Platform } from "react-native";
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
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { getEmailAuthErrorMessage } from "./authErrors";
import { useAuthStore } from "../store/useAuthStore";
import { IUser } from "../types";
import { trimLowercaseText, trimText } from "../utils";

WebBrowser.maybeCompleteAuthSession();

interface IGoogleTokens {
  accessToken?: string | null;
  idToken?: string | null;
}

interface IEmailSignInInput {
  email: string;
  password: string;
}

interface IEmailSignUpInput {
  email: string;
  password: string;
  displayName?: string;
}

const googleScopes = ["openid", "profile", "email"];

const googleClientIds = {
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};
const firebaseProjectNumber = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;

type TGoogleClientIdKey = keyof typeof googleClientIds;

const googleClientEnvVarMap: Record<TGoogleClientIdKey, string> = {
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

interface IFirebaseProfileUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Wraps a promise with a timeout
 * @param operation - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Message to display on timeout
 */
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

/**
 * Maps a Firebase user object to our internal IUser interface
 * @param firebaseUser - The Firebase user object
 * @param overrides - Optional overrides for the mapped user
 */
const mapFirebaseUserToAppUser = (
  firebaseUser: IFirebaseProfileUser,
  overrides?: Partial<IUser>,
): IUser => ({
  uid: firebaseUser.uid,
  email: overrides?.email ?? firebaseUser.email ?? "",
  displayName: overrides?.displayName ?? firebaseUser.displayName ?? "Anonymous",
  photoURL: overrides?.photoURL ?? firebaseUser.photoURL ?? "",
  familyId: overrides?.familyId ?? null,
  role: overrides?.role === "owner" ? "owner" : "member",
});

/**
 * Checks if an error is a Firestore profile timeout
 * @param error - The error to check
 */
const isFirestoreProfileTimeoutError = (error: unknown) =>
  error instanceof Error &&
  (error.message === FIRESTORE_PROFILE_READ_TIMEOUT_MESSAGE ||
    error.message === FIRESTORE_PROFILE_CREATE_TIMEOUT_MESSAGE);

/**
 * Normalizes an email address for consistent storage/comparison
 * @param email - The email to normalize
 */
const normalizeEmail = (email: string) => trimLowercaseText(email);

let activeSignOut: Promise<void> | null = null;
let nativeGoogleSignInConfigured = false;

/**
 * Configures the native Google Sign-In SDK
 */
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

/**
 * Clears persisted authentication session from local storage
 */
const clearPersistedAuthSession = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_STORE_KEY);
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to clear persisted auth session:", error);
    }
  }
};

/**
 * Gets the appropriate Google Client ID for the current platform
 */
const getGoogleClientIdForPlatform = () => {
  if (Platform.OS === "ios") {
    return googleClientIds.iosClientId;
  }

  if (Platform.OS === "android") {
    return googleClientIds.androidClientId;
  }

  return googleClientIds.webClientId;
};

/**
 * Encodes a key-value object into a URL-encoded form body
 * @param payload - The data to encode
 */
const encodeFormBody = (payload: Record<string, string>) =>
  Object.entries(payload)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

/**
 * Returns redirection URI options for Google Auth Session
 */
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

interface IGoogleConfigStatus {
  isConfigured: boolean;
  missingEnvVars: string[];
  invalidFormatEnvVars: string[];
  mismatchedProjectEnvVars: string[];
  duplicateClientEnvVars: string[];
}

/**
 * Returns which Google Client ID keys are required for the current platform
 */
const getRequiredGoogleClientIdKeysForPlatform = (): TGoogleClientIdKey[] => {
  if (Platform.OS === "android") {
    return ["webClientId", "androidClientId"];
  }

  if (Platform.OS === "ios") {
    return ["webClientId", "iosClientId"];
  }

  return ["webClientId"];
};

/**
 * Extracts the project number from a Google Client ID string
 * @param clientId - The client ID to parse
 */
const getProjectNumberFromGoogleClientId = (clientId: string) => {
  const match = trimText(clientId).match(/^(\d+)-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/);
  return match?.[1] ?? null;
};

/**
 * Validates the Google Sign-In environment configuration
 */
export const getGoogleSignInConfigurationStatus = (): IGoogleConfigStatus => {
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

/**
 * Returns true if Google Sign-In is properly configured
 */
export const hasGoogleSignInConfiguration = () => getGoogleSignInConfigurationStatus().isConfigured;

/**
 * Returns a detailed message about Google Sign-In configuration issues
 */
export const getGoogleSignInSetupMessage = () => {
  const { missingEnvVars, invalidFormatEnvVars, mismatchedProjectEnvVars, duplicateClientEnvVars } =
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

/**
 * Creates a placeholder request for when Google Auth is unavailable
 */
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

/**
 * Hook to manage Google ID Token authentication request
 */
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

/**
 * Updates or inserts a user's profile in Firestore
 * @param firebaseUser - The user object from Firebase Auth
 */
const upsertUserProfile = async (firebaseUser: IFirebaseProfileUser) => {
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

    return mapFirebaseUserToAppUser(firebaseUser, userDoc.data() as Partial<IUser>);
  } catch (error) {
    if (isFirestoreProfileTimeoutError(error)) {
      return fallbackUser;
    }

    throw error;
  }
};

/**
 * Signs in to Firebase with Google OAuth tokens
 * @param tokens - Object containing accessToken and/or idToken
 */
export const signInWithGoogleTokens = async ({ accessToken, idToken }: IGoogleTokens) => {
  const googleCredential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);

  const userCredential = await withTimeout(
    signInWithCredential(auth, googleCredential),
    AUTH_OPERATION_TIMEOUT_MS,
    "Timed out while signing in with Firebase.",
  );

  return mapFirebaseUserToAppUser(userCredential.user);
};

/**
 * Performs a native Google Sign-In (Android/iOS)
 */
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

/**
 * Signs in using email and password
 * @param credentials - Email and password
 */
export const signInWithEmailCredentials = async ({ email, password }: IEmailSignInInput) => {
  const userCredential = await withTimeout(
    firebaseSignInWithEmailAndPassword(auth, normalizeEmail(email), password),
    AUTH_OPERATION_TIMEOUT_MS,
    "Timed out while signing in with email and password.",
  );

  return mapFirebaseUserToAppUser(userCredential.user);
};

/**
 * Registers a new user with email and password
 * @param credentials - Registration data including email, password, and name
 */
export const signUpWithEmailCredentials = async ({
  email,
  password,
  displayName,
}: IEmailSignUpInput) => {
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

/**
 * Extracts Google OAuth tokens from an Expo Auth Session result
 * @param response - The result from the Google auth request
 */
export const getGoogleTokensFromResponse = (response: AuthSessionResult | null): IGoogleTokens => {
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

/**
 * Extracts a Google authorization code from an Expo Auth Session result
 * @param response - The result from the Google auth request
 */
export const getGoogleCodeFromResponse = (response: AuthSessionResult | null) => {
  if (response?.type !== "success") {
    return null;
  }

  const params = "params" in response ? response.params : undefined;
  return typeof params?.code === "string" ? params.code : null;
};

/**
 * Exchanges a Google authorization code for access and ID tokens
 * @param options - Code, redirect URI, and PKCE verifier
 */
export const exchangeGoogleCodeForTokens = async ({
  code,
  redirectUri,
  codeVerifier,
}: {
  code: string;
  redirectUri?: string;
  codeVerifier?: string;
}): Promise<IGoogleTokens> => {
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

/**
 * Returns a user-friendly error message for Google Sign-In failures
 * @param error - The error object to map
 */
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

export { getEmailAuthErrorMessage };

/**
 * Signs the user out of Firebase and clears local session state
 */
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

/**
 * Listens to authentication state changes and synchronizes Firestore profile
 * Why: To ensure the application state is always in sync with both Auth and user profile data.
 */
export const listenToAuthChanges = () => {
  const { setUser, setLoading, setProfileSynced } = useAuthStore.getState();
  let authEventVersion = 0;
  let userDocUnsubscribe: (() => void) | null = null;

  return onAuthStateChanged(auth, async (firebaseUser) => {
    const currentEventVersion = ++authEventVersion;

    // Cleanup previous doc listener if it exists
    if (userDocUnsubscribe) {
      userDocUnsubscribe();
      userDocUnsubscribe = null;
    }

    try {
      if (firebaseUser) {
        setProfileSynced(false);
        // 1. Set initial basic info from Auth (fastest UI update)
        setUser(mapFirebaseUserToAppUser(firebaseUser));

        // 2. Start real-time listener for Firestore profile
        const userDocRef = doc(db, "users", firebaseUser.uid);
        userDocUnsubscribe = onSnapshot(
          userDocRef,
          (snapshot) => {
            // Avoid stale writes if auth state changed while waiting for snapshot
            if (
              currentEventVersion !== authEventVersion ||
              auth.currentUser?.uid !== firebaseUser.uid
            ) {
              return;
            }

            if (snapshot.exists()) {
              const userData = snapshot.data() as Partial<IUser>;
              setUser(mapFirebaseUserToAppUser(firebaseUser, userData));
              setProfileSynced(true);
            } else {
              setProfileSynced(false);
              // Document doesn't exist yet, try to create it (fallback logic)
              void upsertUserProfile(firebaseUser);
            }
          },
          (error) => {
            setProfileSynced(false);
            if (__DEV__) console.warn("User Doc Listener Error:", error);
          },
        );
      } else {
        setProfileSynced(false);
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
        setProfileSynced(false);
      } else {
        setProfileSynced(false);
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

/**
 * Updates the user's account profile in both Firebase Auth and Firestore
 * @param uid - The user's UID
 * @param data - The profile data to update (displayName, photoURL)
 */
export const updateUserAccountProfile = async (
  uid: string,
  data: { displayName?: string; photoURL?: string },
) => {
  const { setUser, user } = useAuthStore.getState();

  try {
    const userDocRef = doc(db, "users", uid);
    await withTimeout(
      updateDoc(userDocRef, data),
      AUTH_OPERATION_TIMEOUT_MS,
      "Timed out while updating your profile in Firestore.",
    );

    if (auth.currentUser && auth.currentUser.uid === uid) {
      await withTimeout(
        updateProfile(auth.currentUser, data),
        AUTH_OPERATION_TIMEOUT_MS,
        "Timed out while updating your account profile.",
      );
    }

    // Update local store state
    if (user && user.uid === uid) {
      setUser({ ...user, ...data });
    }
  } catch (error) {
    console.error("Update Profile Error:", error);
    throw error;
  }
};
