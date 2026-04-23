import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShoppingBasket,
  UserRound,
} from "lucide-react-native";
import { AuthSessionResult } from "expo-auth-session";
import {
  exchangeGoogleCodeForTokens,
  getEmailAuthErrorMessage,
  getGoogleCodeFromResponse,
  getGoogleSignInErrorMessage,
  getGoogleSignInSetupMessage,
  getGoogleTokensFromResponse,
  hasGoogleSignInConfiguration,
  signInWithEmailCredentials,
  signInWithGoogleTokens,
  signUpWithEmailCredentials,
  useGoogleAuthRequest,
} from "../services/auth";

type AuthMode = "signIn" | "signUp";

const placeholderColor = "#95a39a";
const fieldIconColor = "#95a39a";
const emailPattern = /^\S+@\S+\.\S+$/;

const LoginScreen = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [request, , promptAsync] = useGoogleAuthRequest();
  const [googleBusy, setGoogleBusy] = useState(false);
  const googleConfigured = hasGoogleSignInConfiguration();

  const isBusy = emailBusy || googleBusy;

  const validateEmailAuthInput = () => {
    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (authMode === "signUp" && !trimmedName) {
      return "Name is required.";
    }

    if (!trimmedEmail) {
      return "Email is required.";
    }

    if (!emailPattern.test(trimmedEmail)) {
      return "Enter a valid email address.";
    }

    if (!password) {
      return "Password is required.";
    }

    if (password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (authMode === "signUp" && password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  };

  const finishGoogleSignIn = async (response: AuthSessionResult | null) => {
    if (!response) {
      return;
    }

    if (response.type === "dismiss" || response.type === "cancel") {
      return;
    }

    if (response.type === "error") {
      const errorMessage =
        "error" in response && response.error?.message
          ? response.error.message
          : "Google account selection could not be completed.";
      throw new Error(errorMessage);
    }

    if (response.type !== "success") {
      return;
    }

    let { accessToken, idToken } = getGoogleTokensFromResponse(response);

    if (!accessToken && !idToken) {
      const code = getGoogleCodeFromResponse(response);

      if (code) {
        const exchangedTokens = await exchangeGoogleCodeForTokens({
          code,
          redirectUri: request?.redirectUri,
          codeVerifier: request?.codeVerifier,
        });

        accessToken = exchangedTokens.accessToken ?? null;
        idToken = exchangedTokens.idToken ?? null;
      }
    }

    if (!accessToken && !idToken) {
      throw new Error("Google did not return a usable authentication token.");
    }

    await signInWithGoogleTokens({ accessToken, idToken });
  };

  const handleGoogleSignIn = async () => {
    if (!googleConfigured) {
      Alert.alert("Google Sign-In Needs Setup", getGoogleSignInSetupMessage());
      return;
    }

    if (!request) {
      Alert.alert(
        "Google Sign-In Not Ready",
        "The Google login request is still loading. Try again in a moment.",
      );
      return;
    }

    try {
      setGoogleBusy(true);
      const response = await promptAsync();
      await finishGoogleSignIn(response);
    } catch (error) {
      Alert.alert("Google Sign-In Failed", getGoogleSignInErrorMessage(error));
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleEmailAuth = async () => {
    const validationError = validateEmailAuthInput();

    if (validationError) {
      Alert.alert("Invalid Input", validationError);
      return;
    }

    try {
      setEmailBusy(true);

      if (authMode === "signIn") {
        await signInWithEmailCredentials({ email, password });
      } else {
        await signUpWithEmailCredentials({
          displayName,
          email,
          password,
        });
      }
    } catch (error) {
      Alert.alert(
        authMode === "signIn" ? "Sign-In Failed" : "Account Creation Failed",
        getEmailAuthErrorMessage(error),
      );
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 justify-center px-8 py-10">
          <View className="items-center">
            <View className="mb-7 h-14 w-14 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-600 shadow-sm shadow-primary-200">
              <ShoppingBasket size={24} color="white" strokeWidth={2.2} />
            </View>

            <Text className="text-[11px] font-semibold uppercase tracking-[2.4px] text-text-subtle">
              Family Grocery
            </Text>
            <Text className="mt-2 text-center text-[29px] font-bold tracking-tight text-text-primary">
              {authMode === "signIn" ? "Welcome Back" : "Create Account"}
            </Text>
            <Text className="mt-2 px-5 text-center text-[14px] leading-6 text-text-secondary">
              {authMode === "signIn"
                ? "Sign in to manage groceries with your family in real time."
                : "Create your account to start your shared family grocery list."}
            </Text>
          </View>

          <View className="mt-10 flex-row rounded-full border border-border-muted bg-surface p-1">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setAuthMode("signIn")}
              disabled={isBusy}
              className={`flex-1 rounded-full py-2.5 ${authMode === "signIn" ? "bg-primary-700" : ""}`}
            >
              <Text
                className={`text-center text-[14px] font-semibold ${authMode === "signIn" ? "text-text-inverse" : "text-text-secondary"}`}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setAuthMode("signUp")}
              disabled={isBusy}
              className={`flex-1 rounded-full py-2.5 ${authMode === "signUp" ? "bg-primary-700" : ""}`}
            >
              <Text
                className={`text-center text-[14px] font-semibold ${authMode === "signUp" ? "text-text-inverse" : "text-text-secondary"}`}
              >
                Create
              </Text>
            </TouchableOpacity>
          </View>

          {authMode === "signUp" ? (
            <View className="mt-5 flex-row items-center border-b border-border pb-2.5">
              <UserRound size={17} color={fieldIconColor} />
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Full name"
                placeholderTextColor={placeholderColor}
                className="ml-3 h-11 flex-1 text-[15px] font-medium text-text-primary"
              />
            </View>
          ) : null}

          <View className="mt-5 flex-row items-center border-b border-border pb-2.5">
            <Mail size={17} color={fieldIconColor} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="Email"
              placeholderTextColor={placeholderColor}
              className="ml-3 h-11 flex-1 text-[15px] font-medium text-text-primary"
            />
          </View>

          <View className="mt-5 flex-row items-center border-b border-border pb-2.5">
            <Lock size={17} color={fieldIconColor} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType={
                authMode === "signIn" ? "password" : "newPassword"
              }
              placeholder="Password"
              placeholderTextColor={placeholderColor}
              className="ml-3 h-11 flex-1 text-[15px] font-medium text-text-primary"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={12}
            >
              {showPassword ? (
                <EyeOff size={17} color={fieldIconColor} />
              ) : (
                <Eye size={17} color={fieldIconColor} />
              )}
            </TouchableOpacity>
          </View>

          {authMode === "signUp" ? (
            <View className="mt-5 flex-row items-center border-b border-border pb-2.5">
              <Lock size={17} color={fieldIconColor} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                textContentType="newPassword"
                placeholder="Confirm password"
                placeholderTextColor={placeholderColor}
                className="ml-3 h-11 flex-1 text-[15px] font-medium text-text-primary"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                hitSlop={12}
              >
                {showConfirmPassword ? (
                  <EyeOff size={17} color={fieldIconColor} />
                ) : (
                  <Eye size={17} color={fieldIconColor} />
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleEmailAuth}
            activeOpacity={0.88}
            disabled={isBusy}
            className="mt-7 flex-row items-center justify-center rounded-full bg-primary-700 py-3.5 shadow-sm shadow-primary-200 disabled:opacity-60"
          >
            <Text className="text-[15px] font-bold text-text-inverse">
              {emailBusy
                ? authMode === "signIn"
                  ? "Signing In..."
                  : "Creating Account..."
                : authMode === "signIn"
                  ? "Sign In"
                  : "Create Account"}
            </Text>
            <ArrowRight
              size={17}
              color="#f6fbf7"
              strokeWidth={2.3}
              className="ml-2"
            />
          </TouchableOpacity>

          <View className="my-7 flex-row items-center">
            <View className="h-px flex-1 bg-border" />
            <Text className="mx-3 text-[11px] font-semibold uppercase tracking-[2px] text-text-subtle">
              or
            </Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          <TouchableOpacity
            onPress={handleGoogleSignIn}
            activeOpacity={0.88}
            disabled={isBusy || !request || !googleConfigured}
            className="flex-row items-center justify-center rounded-full border border-border bg-surface py-3 disabled:opacity-60"
          >
            <Image
              source={{
                uri: "https://developers.google.com/identity/images/g-logo.png",
              }}
              className="mr-3 h-5 w-5"
            />
            <Text className="text-[14px] font-semibold text-text-secondary">
              {googleBusy ? "Opening Google..." : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          {!googleConfigured ? (
            <Text className="mt-2 text-center text-[11px] text-medium">
              Google Sign-In needs setup for this build.
            </Text>
          ) : null}

          <Text className="mt-7 text-center text-[11px] uppercase tracking-[2px] text-text-subtle">
            Family Grocery • v1.0.0
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
