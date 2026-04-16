import {
    signInWithCredential,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
import { useAuthStore } from "../store/useAuthStore";
import { User } from "../types";

// Lazy-load GoogleSignin so that missing native module doesn't crash at import
// time when running in Expo Go. It will only throw when actually called.
let _GoogleSignin: typeof import("@react-native-google-signin/google-signin").GoogleSignin | null = null;
const getGoogleSignin = () => {
    if (!_GoogleSignin) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            _GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
        } catch (e) {
            console.warn(
                "[Auth] @react-native-google-signin is not available in this environment. " +
                "Google Sign-In requires a development build (EAS Build / expo-dev-client)."
            );
        }
    }
    return _GoogleSignin;
};

// Configure Google Sign-In — safe to call on every app launch.
// Will silently no-op if running in Expo Go (native module unavailable).
export const configureGoogleSignIn = () => {
    try {
        getGoogleSignin()?.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        });
    } catch (e) {
        console.warn("[Auth] configureGoogleSignIn failed:", e);
    }
};

export const signInWithGoogle = async () => {
    const GoogleSignin = getGoogleSignin();
    if (!GoogleSignin) {
        throw new Error(
            "Google Sign-In is not available in Expo Go. " +
            "Please use a development build or tap 'Guest Sign In' to test."
        );
    }

    try {
        await GoogleSignin.hasPlayServices();
        const response = await GoogleSignin.signIn();

        if (response.type !== "success") {
            throw new Error(
                "Google Sign-In was not successful or was cancelled",
            );
        }

        const { idToken } = response.data;
        if (!idToken) throw new Error("No ID Token found");

        const googleCredential = GoogleAuthProvider.credential(idToken);

        const userCredential = await signInWithCredential(
            auth,
            googleCredential,
        );
        const firebaseUser = userCredential.user;

        // Check if user exists in Firestore, if not create
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
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        throw error;
    }
};

// Mock Sign-In for testing without native modules
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
        await getGoogleSignin()?.signOut();
        useAuthStore.getState().setUser(null);
    } catch (error) {
        console.error("Sign-Out Error:", error);
    }
};

export const listenToAuthChanges = () => {
    const { setUser, setLoading } = useAuthStore.getState();

    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                setUser(userDoc.data() as User);
            } else {
                // This shouldn't happen if sign-in flow is correct
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });
};
