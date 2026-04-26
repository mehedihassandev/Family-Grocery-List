import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, inMemoryPersistence } from "firebase/auth";
import { enableIndexedDbPersistence, getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export let analytics: unknown = null;

if (Platform.OS === "web") {
  void (async () => {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (await isSupported()) {
      analytics = getAnalytics(app);
    }
  })();
}

const createNativeAuth = () => {
  try {
    // Load from firebase/auth so React Native can resolve its RN auth
    // entrypoint and expose getReactNativePersistence at runtime.

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getReactNativePersistence } = require("@firebase/auth") as {
      getReactNativePersistence?: (storage: unknown) => unknown;
    };

    // AsyncStorage is optional at runtime so Expo Go can still boot even
    // before the dependency is installed.

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;

    if (getReactNativePersistence) {
      return initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage) as never,
      });
    }

    return initializeAuth(app, {
      persistence: inMemoryPersistence,
    });
  } catch {
    return initializeAuth(app, {
      persistence: inMemoryPersistence,
    });
  }
};

export const auth = Platform.OS === "web" ? getAuth(app) : createNativeAuth();

const createFirestore = () => {
  if (Platform.OS === "web") {
    return getFirestore(app);
  }

  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    // Hot reload can initialize Firestore already; fallback to existing instance.
    return getFirestore(app);
  }
};

export const db = createFirestore();

if (Platform.OS === "web") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn("Persistence failed: Multiple tabs open");
    } else if (err.code === "unimplemented") {
      console.warn("Persistence failed: Browser not supported");
    }
  });
}

export default app;
