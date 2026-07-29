import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
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
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  getEmailAuthErrorMessage,
  getGoogleSignInErrorMessage,
  getGoogleSignInSetupMessage,
  hasGoogleSignInConfiguration,
  signInWithEmailCredentials,
  signInWithGoogle,
  signUpWithEmailCredentials,
} from "../services/auth";
import {
  getValidationSchema,
  type SignInFormValues,
  type SignUpFormValues,
} from "../utils/validationSchemas";
import { EFormModelKey, getFormDefaultValues } from "../utils";

type AuthMode = "signIn" | "signUp";

const fieldIconColor = "#94A3B8";

/**
 * Modern Login Screen
 * Why: Pure white aesthetic, sleek form inputs, and smooth entrance animation.
 */
const LoginScreen = () => {
  const [authMode, setAuthMode] = useState<AuthMode>("signIn");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const googleConfigured = hasGoogleSignInConfiguration();

  const isBusy = emailBusy || googleBusy;

  const signInForm = useForm<SignInFormValues>({
    resolver: yupResolver(getValidationSchema(EFormModelKey.AUTH_SIGN_IN)),
    mode: "onTouched",
    defaultValues: getFormDefaultValues(EFormModelKey.AUTH_SIGN_IN),
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: yupResolver(getValidationSchema(EFormModelKey.AUTH_SIGN_UP)),
    mode: "onTouched",
    defaultValues: getFormDefaultValues(EFormModelKey.AUTH_SIGN_UP),
  });

  const switchMode = (mode: AuthMode) => {
    if (isBusy) return;
    setAuthMode(mode);
    signInForm.reset();
    signUpForm.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleGoogleSignIn = async () => {
    if (!googleConfigured) {
      Alert.alert("Google Sign-In Needs Setup", getGoogleSignInSetupMessage());
      return;
    }

    try {
      setGoogleBusy(true);
      await signInWithGoogle();
    } catch (error) {
      Alert.alert("Google Sign-In Failed", getGoogleSignInErrorMessage(error));
    } finally {
      setGoogleBusy(false);
    }
  };

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

  const onSubmitPress =
    authMode === "signIn"
      ? signInForm.handleSubmit(handleSignIn)
      : signUpForm.handleSubmit(handleSignUp);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          className="flex-1 justify-center px-8 py-10"
        >
          {/* Header */}
          <View className="items-center">
            <View className="mb-6 h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-sm border border-emerald-500">
              <ShoppingBasket size={24} color="white" strokeWidth={2.2} />
            </View>

            <Text className="text-[10px] font-bold uppercase tracking-[2.4px] text-slate-400">
              Family Grocery
            </Text>
            <Text className="mt-1.5 text-center text-[28px] font-extrabold tracking-tight text-slate-900">
              {authMode === "signIn" ? "Welcome Back" : "Create Account"}
            </Text>
            <Text className="mt-1.5 px-4 text-center text-[13px] leading-5 text-slate-500">
              {authMode === "signIn"
                ? "Sign in to manage groceries with your family in real time."
                : "Create your account to start your shared family grocery list."}
            </Text>
          </View>

          {/* Mode toggle */}
          <View className="mt-8 flex-row rounded-2xl border border-slate-100 bg-slate-50 p-1">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => switchMode("signIn")}
              disabled={isBusy}
              className={`flex-1 rounded-xl py-2.5 ${authMode === "signIn" ? "bg-emerald-600 shadow-2xs" : ""}`}
            >
              <Text
                className={`text-center text-[13px] font-bold ${authMode === "signIn" ? "text-white" : "text-slate-500"}`}
              >
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => switchMode("signUp")}
              disabled={isBusy}
              className={`flex-1 rounded-xl py-2.5 ${authMode === "signUp" ? "bg-emerald-600 shadow-2xs" : ""}`}
            >
              <Text
                className={`text-center text-[13px] font-bold ${authMode === "signUp" ? "text-white" : "text-slate-500"}`}
              >
                Create
              </Text>
            </TouchableOpacity>
          </View>

          {/* Display Name (sign-up only) */}
          {authMode === "signUp" && (
            <View className="mt-4">
              <RhfTextfield
                control={signUpForm.control}
                name="displayName"
                icon={<UserRound size={16} color={fieldIconColor} />}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Full name"
              />
            </View>
          )}

          {/* Email */}
          <View className="mt-4">
            {authMode === "signIn" ? (
              <RhfTextfield
                control={signInForm.control}
                name="email"
                icon={<Mail size={16} color={fieldIconColor} />}
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
                icon={<Mail size={16} color={fieldIconColor} />}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="Email"
              />
            )}
          </View>

          {/* Password */}
          <View className="mt-4">
            {authMode === "signIn" ? (
              <RhfTextfield
                control={signInForm.control}
                name="password"
                icon={<Lock size={16} color={fieldIconColor} />}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                placeholder="Password"
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} hitSlop={12}>
                    {showPassword ? (
                      <EyeOff size={16} color={fieldIconColor} />
                    ) : (
                      <Eye size={16} color={fieldIconColor} />
                    )}
                  </TouchableOpacity>
                }
              />
            ) : (
              <RhfTextfield
                control={signUpForm.control}
                name="password"
                icon={<Lock size={16} color={fieldIconColor} />}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="newPassword"
                placeholder="Password"
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} hitSlop={12}>
                    {showPassword ? (
                      <EyeOff size={16} color={fieldIconColor} />
                    ) : (
                      <Eye size={16} color={fieldIconColor} />
                    )}
                  </TouchableOpacity>
                }
              />
            )}
          </View>

          {/* Confirm Password */}
          {authMode === "signUp" && (
            <View className="mt-4">
              <RhfTextfield
                control={signUpForm.control}
                name="confirmPassword"
                icon={<Lock size={16} color={fieldIconColor} />}
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
                      <EyeOff size={16} color={fieldIconColor} />
                    ) : (
                      <Eye size={16} color={fieldIconColor} />
                    )}
                  </TouchableOpacity>
                }
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={onSubmitPress}
            activeOpacity={0.88}
            disabled={isBusy}
            className="mt-6 flex-row items-center justify-center rounded-xl bg-emerald-600 h-[48px] shadow-sm disabled:opacity-60"
          >
            <Text className="text-[14px] font-bold text-white">
              {emailBusy
                ? authMode === "signIn"
                  ? "Signing In..."
                  : "Creating Account..."
                : authMode === "signIn"
                  ? "Sign In"
                  : "Create Account"}
            </Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.3} className="ml-2" />
          </TouchableOpacity>

          {/* Divider */}
          <View className="my-6 flex-row items-center">
            <View className="h-px flex-1 bg-slate-100" />
            <Text className="mx-3 text-[10px] font-bold uppercase tracking-[2px] text-slate-400">
              or
            </Text>
            <View className="h-px flex-1 bg-slate-100" />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            activeOpacity={0.88}
            disabled={isBusy || !googleConfigured}
            className="flex-row items-center justify-center rounded-xl border border-slate-200 bg-white h-[48px] disabled:opacity-60"
          >
            <Image
              source={{
                uri: "https://developers.google.com/identity/images/g-logo.png",
              }}
              className="mr-2.5 h-5 w-5"
            />
            <Text className="text-[13px] font-bold text-slate-700">
              {googleBusy ? "Opening Google..." : "Continue with Google"}
            </Text>
          </TouchableOpacity>

          {!googleConfigured && (
            <Text className="mt-2 text-center text-[10px] text-slate-400">
              Google Sign-In needs setup for this build.
            </Text>
          )}

          <Text className="mt-6 text-center text-[10px] uppercase tracking-[2px] text-slate-300">
            Family Grocery • v2.1.0
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
