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
import { RhfTextfield } from "../components/ui";
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
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
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
import {
  signInSchema,
  signUpSchema,
  type SignInFormValues,
  type SignUpFormValues,
} from "../utils/validationSchemas";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type AuthMode = "signIn" | "signUp";

const fieldIconColor = "#95a39a";

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const LoginScreen = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [request, , promptAsync] = useGoogleAuthRequest();
  const [googleBusy, setGoogleBusy] = useState(false);
  const googleConfigured = hasGoogleSignInConfiguration();

  const isBusy = emailBusy || googleBusy;

  // ---------------------------------------------------------------------------
  // React Hook Form — Sign In
  // useForm is initialised with the matching Yup resolver so the schema drives
  // all validation; no manual validate* functions needed.
  // ---------------------------------------------------------------------------
  const signInForm = useForm<SignInFormValues>({
    resolver: yupResolver(signInSchema),
    mode: "onTouched", // validate on blur, re-validate on change after first touch
    defaultValues: { email: "", password: "" },
  });

  // ---------------------------------------------------------------------------
  // React Hook Form — Sign Up
  // A separate form instance so switching tabs resets the inactive form state.
  // ---------------------------------------------------------------------------
  const signUpForm = useForm<SignUpFormValues>({
    resolver: yupResolver(signUpSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Whichever form is active — simplifies the submit handler reference
  const activeForm = authMode === "signIn" ? signInForm : signUpForm;

  // ---------------------------------------------------------------------------
  // Switch tabs — reset both forms to avoid stale errors flashing
  // ---------------------------------------------------------------------------
  const switchMode = (mode: AuthMode) => {
    if (isBusy) return;
    setAuthMode(mode);
    signInForm.reset();
    signUpForm.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // ---------------------------------------------------------------------------
  // Google Sign-In helpers (unchanged from original flow)
  // ---------------------------------------------------------------------------

  const finishGoogleSignIn = async (response: AuthSessionResult | null) => {
    if (!response) return;
    if (response.type === "dismiss" || response.type === "cancel") return;

    if (response.type === "error") {
      const errorMessage =
        "error" in response && response.error?.message
          ? response.error.message
          : "Google account selection could not be completed.";
      throw new Error(errorMessage);
    }

    if (response.type !== "success") return;

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

  // ---------------------------------------------------------------------------
  // Email Auth — called by handleSubmit which has already run Yup validation
  // ---------------------------------------------------------------------------

  /**
   * Handles email sign-in. Only called when Yup validation has passed,
   * so values are guaranteed to be valid here.
   *
   * @param values - Validated form values from RHF handleSubmit
   */
  const handleSignIn = async (values: SignInFormValues) => {
    try {
      setEmailBusy(true);
      await signInWithEmailCredentials({ email: values.email, password: values.password });
    } catch (error) {
      Alert.alert("Sign-In Failed", getEmailAuthErrorMessage(error));
    } finally {
      setEmailBusy(false);
    }
  };

  /**
   * Handles email sign-up. Only called when Yup validation has passed.
   *
   * @param values - Validated form values from RHF handleSubmit
   */
  const handleSignUp = async (values: SignUpFormValues) => {
    try {
      setEmailBusy(true);
      await signUpWithEmailCredentials({
        displayName: values.displayName,
        email: values.email,
        password: values.password,
      });
    } catch (error) {
      Alert.alert("Account Creation Failed", getEmailAuthErrorMessage(error));
    } finally {
      setEmailBusy(false);
    }
  };

  // handleSubmit validates first; only fires the callback when all fields pass
  const onSubmitPress =
    authMode === "signIn"
      ? signInForm.handleSubmit(handleSignIn)
      : signUpForm.handleSubmit(handleSignUp);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 justify-center px-8 py-10">
          {/* ── Header ── */}
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

          {/* ── Mode toggle (Sign In / Create) ── */}
          <View className="mt-10 flex-row rounded-full border border-border-muted bg-surface p-1">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => switchMode("signIn")}
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
              onPress={() => switchMode("signUp")}
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

          {/* ── Display Name (sign-up only) ── */}
          {authMode === "signUp" && (
            <View className="mt-5">
              <RhfTextfield
                control={signUpForm.control}
                name="displayName"
                icon={<UserRound size={17} color={fieldIconColor} />}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Full name"
              />
            </View>
          )}

          {/* ── Email — rendered per-mode so the control type is never a union ── */}
          <View className="mt-5">
            {authMode === "signIn" ? (
              <RhfTextfield
                control={signInForm.control}
                name="email"
                icon={<Mail size={17} color={fieldIconColor} />}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="Email"
              />
            ) : (
              <RhfTextfield
                control={signUpForm.control}
                name="email"
                icon={<Mail size={17} color={fieldIconColor} />}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="Email"
              />
            )}
          </View>

          {/* ── Password — rendered per-mode so the control type is never a union ── */}
          <View className="mt-5">
            {authMode === "signIn" ? (
              <RhfTextfield
                control={signInForm.control}
                name="password"
                icon={<Lock size={17} color={fieldIconColor} />}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                placeholder="Password"
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} hitSlop={12}>
                    {showPassword ? (
                      <EyeOff size={17} color={fieldIconColor} />
                    ) : (
                      <Eye size={17} color={fieldIconColor} />
                    )}
                  </TouchableOpacity>
                }
              />
            ) : (
              <RhfTextfield
                control={signUpForm.control}
                name="password"
                icon={<Lock size={17} color={fieldIconColor} />}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="newPassword"
                placeholder="Password"
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} hitSlop={12}>
                    {showPassword ? (
                      <EyeOff size={17} color={fieldIconColor} />
                    ) : (
                      <Eye size={17} color={fieldIconColor} />
                    )}
                  </TouchableOpacity>
                }
              />
            )}
          </View>

          {/* ── Confirm Password (sign-up only) ── */}
          {authMode === "signUp" && (
            <View className="mt-5">
              <RhfTextfield
                control={signUpForm.control}
                name="confirmPassword"
                icon={<Lock size={17} color={fieldIconColor} />}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                textContentType="newPassword"
                placeholder="Confirm password"
                rightIcon={
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
                }
              />
            </View>
          )}

          {/* ── Submit ── */}
          <TouchableOpacity
            onPress={onSubmitPress}
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
            <ArrowRight size={17} color="#f6fbf7" strokeWidth={2.3} className="ml-2" />
          </TouchableOpacity>

          {/* ── Divider ── */}
          <View className="my-7 flex-row items-center">
            <View className="h-px flex-1 bg-border" />
            <Text className="mx-3 text-[11px] font-semibold uppercase tracking-[2px] text-text-subtle">
              or
            </Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          {/* ── Google Sign-In ── */}
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

          {!googleConfigured && (
            <Text className="mt-2 text-center text-[11px] text-medium">
              Google Sign-In needs setup for this build.
            </Text>
          )}

          <Text className="mt-7 text-center text-[11px] uppercase tracking-[2px] text-text-subtle">
            Family Grocery • v1.0.0
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
