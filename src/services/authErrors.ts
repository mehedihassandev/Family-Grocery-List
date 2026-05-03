import { FirebaseError } from "firebase/app";

/**
 * Type guard for Firebase authentication errors.
 */
const isFirebaseAuthError = (error: unknown): error is FirebaseError =>
  error instanceof FirebaseError ||
  (typeof error === "object" && error !== null && "code" in error);

/**
 * Returns a user-friendly error message for email authentication failures.
 */
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
