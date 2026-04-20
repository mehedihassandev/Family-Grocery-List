import React, { useEffect, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogIn } from "lucide-react-native";
import {
    getGoogleSignInSetupMessage,
    getGoogleSignInErrorMessage,
    getGoogleTokensFromResponse,
    hasGoogleSignInConfiguration,
    mockSignIn,
    signInWithGoogleTokens,
    useGoogleAuthRequest,
} from "../services/auth";
import { useAuthStore } from "../store/useAuthStore";

const LoginScreen = () => {
    const { loading, setLoading } = useAuthStore();
    const [request, response, promptAsync] = useGoogleAuthRequest();
    const [googleBusy, setGoogleBusy] = useState(false);

    useEffect(() => {
        let mounted = true;

        const finishGoogleSignIn = async () => {
            if (!response) {
                return;
            }

            if (response.type === "dismiss" || response.type === "cancel") {
                if (mounted) {
                    setGoogleBusy(false);
                    setLoading(false);
                }
                return;
            }

            if (response.type === "error") {
                const errorMessage =
                    "error" in response && response.error?.message
                        ? response.error.message
                        : "Google account selection could not be completed.";

                if (mounted) {
                    setGoogleBusy(false);
                    setLoading(false);
                    Alert.alert("Google Sign-In Failed", errorMessage);
                }
                return;
            }

            if (response.type !== "success") {
                if (mounted) {
                    setGoogleBusy(false);
                    setLoading(false);
                }
                return;
            }

            try {
                const { accessToken, idToken } =
                    getGoogleTokensFromResponse(response);

                if (!accessToken && !idToken) {
                    throw new Error(
                        "Google did not return a usable authentication token.",
                    );
                }

                await signInWithGoogleTokens({ accessToken, idToken });
            } catch (error) {
                if (mounted) {
                    Alert.alert(
                        "Google Sign-In Failed",
                        getGoogleSignInErrorMessage(error),
                    );
                }
            } finally {
                if (mounted) {
                    setGoogleBusy(false);
                    setLoading(false);
                }
            }
        };

        void finishGoogleSignIn();

        return () => {
            mounted = false;
        };
    }, [response, setLoading]);

    const handleGoogleSignIn = async () => {
        if (!hasGoogleSignInConfiguration()) {
            Alert.alert(
                "Google Sign-In Needs Setup",
                getGoogleSignInSetupMessage(),
            );
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
            setLoading(true);
            await promptAsync();
        } catch (error) {
            setGoogleBusy(false);
            setLoading(false);
            Alert.alert(
                "Google Sign-In Failed",
                getGoogleSignInErrorMessage(error),
            );
        }
    };

    const handleMockSignIn = async () => {
        setLoading(true);
        await mockSignIn();
        setLoading(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 justify-center px-10">
                <View className="mb-16 items-center">
                    <View className="mb-10 h-28 w-28 items-center justify-center rounded-[40px] bg-emerald-50 shadow-sm shadow-emerald-100">
                        <Image
                            source={{
                                uri: "https://cdn-icons-png.flaticon.com/512/3724/3724720.png",
                            }}
                            className="h-16 w-16"
                        />
                    </View>

                    <Text className="mb-3 text-center text-4xl font-black tracking-tighter text-gray-900">
                        Freshly<Text className="text-emerald-500">.</Text>
                    </Text>
                    <Text className="px-4 text-center text-base font-medium leading-6 text-gray-400">
                        The elegant way to manage your family grocery list
                        together.
                    </Text>
                </View>

                <View className="gap-4">
                    <TouchableOpacity
                        onPress={handleGoogleSignIn}
                        activeOpacity={0.8}
                        disabled={googleBusy || loading}
                        className="w-full flex-row items-center justify-center rounded-3xl border border-gray-100 bg-white py-5 shadow-sm shadow-gray-100 disabled:opacity-60"
                    >
                        <Image
                            source={{
                                uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
                            }}
                            className="mr-4 h-6 w-6"
                        />
                        <Text className="text-base font-bold text-gray-800">
                            {googleBusy
                                ? "Opening Google..."
                                : "Continue with Google"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleMockSignIn}
                        activeOpacity={0.9}
                        disabled={loading}
                        className="w-full flex-row items-center justify-center rounded-3xl bg-emerald-500 py-5 shadow-lg shadow-emerald-200 disabled:opacity-60"
                    >
                        <LogIn
                            stroke="white"
                            size={20}
                            strokeWidth={2.5}
                            className="mr-3"
                        />
                        <Text className="text-base font-bold text-white">
                            Guest Sign In
                        </Text>
                    </TouchableOpacity>
                </View>

                <View className="mt-20 items-center">
                    <Text className="text-[10px] font-bold uppercase tracking-[2px] text-gray-300">
                        Family Grocery • v1.0.0
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;
