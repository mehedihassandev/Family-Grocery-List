import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { AuthSessionResult } from "expo-auth-session";
import { Platform } from "react-native";
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signOut as firebaseSignOut,
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

const googleScopes = ["openid", "profile", "email"];

const googleClientIds = {
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

type GoogleConfigStatus = {
    isConfigured: boolean;
    missingEnvVars: string[];
};

export const getGoogleSignInConfigurationStatus = (): GoogleConfigStatus => {
    const missingEnvVars: string[] = [];

    if (!googleClientIds.webClientId) {
        missingEnvVars.push("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");
    }

    if (Platform.OS === "android" && !googleClientIds.androidClientId) {
        missingEnvVars.push("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID");
    }

    if (Platform.OS === "ios" && !googleClientIds.iosClientId) {
        missingEnvVars.push("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID");
    }

    return {
        isConfigured: missingEnvVars.length === 0,
        missingEnvVars,
    };
};

export const hasGoogleSignInConfiguration = () =>
    getGoogleSignInConfigurationStatus().isConfigured;

export const getGoogleSignInSetupMessage = () => {
    const { missingEnvVars } = getGoogleSignInConfigurationStatus();

    if (missingEnvVars.length === 0) {
        return "Google Sign-In is configured.";
    }

    return `Add the following environment variable${missingEnvVars.length > 1 ? "s" : ""} before trying again:\n\n${missingEnvVars.join("\n")}`;
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

export const useGoogleAuthRequest = () =>
    hasGoogleSignInConfiguration()
        ? Google.useIdTokenAuthRequest(
              {
                  ...googleClientIds,
                  scopes: googleScopes,
                  shouldAutoExchangeCode: false,
                  selectAccount: true,
              },
          )
        : createUnavailableGoogleAuthRequest();

const upsertUserProfile = async (firebaseUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            displayName: firebaseUser.displayName || "Anonymous",
            photoURL: firebaseUser.photoURL || "",
            familyId: null,
            role: "member",
        };
        await setDoc(userDocRef, newUser);
        return newUser;
    }

    return userDoc.data() as User;
};

export const signInWithGoogleTokens = async ({
    accessToken,
    idToken,
}: GoogleTokens) => {
    const googleCredential = GoogleAuthProvider.credential(
        idToken ?? null,
        accessToken ?? null,
    );

    const userCredential = await signInWithCredential(auth, googleCredential);
    return upsertUserProfile(userCredential.user);
};

export const getGoogleTokensFromResponse = (
    response: AuthSessionResult | null,
): GoogleTokens => {
    if (response?.type !== "success") {
        return {};
    }

    const params = "params" in response ? response.params : undefined;
    const authentication =
        "authentication" in response ? response.authentication : undefined;

    return {
        accessToken:
            authentication?.accessToken ??
            (typeof params?.access_token === "string"
                ? params.access_token
                : null),
        idToken:
            authentication?.idToken ??
            (typeof params?.id_token === "string" ? params.id_token : null),
    };
};

export const getGoogleSignInErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return "Unable to continue with Google Sign-In right now.";
};

export const mockSignIn = async () => {
    const mockUser: User = {
        uid: "mock_user_123",
        email: "test@example.com",
        displayName: "Test User",
        photoURL: "https://i.pravatar.cc/150?u=mock_user_123",
        familyId: null,
        role: "owner",
    };
    useAuthStore.getState().setUser(mockUser);
    return mockUser;
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
        useAuthStore.getState().setUser(null);
    } catch (error) {
        console.error("Sign-Out Error:", error);
    }
};

export const listenToAuthChanges = () => {
    const { setUser, setLoading } = useAuthStore.getState();

    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const user = await upsertUserProfile(firebaseUser);
            setUser(user);
        } else {
            setUser(null);
        }

        setLoading(false);
    });
};
