import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HelpCircle, Bug, ExternalLink, Info } from "lucide-react-native";
import { SubHeader, Card } from "../components/ui";

const HelpSupportScreen = () => {
  const openUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Can't open link", url);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Couldn't open link", error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <SubHeader title="Help & Support" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <View className="items-center mb-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 mb-4">
              <HelpCircle stroke="#59AC77" size={32} />
            </View>
            <Text className="text-[24px] font-black text-text-primary mb-2 text-center">
              Need help?
            </Text>
            <Text className="text-[15px] text-text-secondary text-center px-4">
              Here are quick fixes for the most common issues.
            </Text>
          </View>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-primary mb-2">Common fixes</Text>
            <Text className="text-[13px] leading-5 text-text-secondary">
              • Invite code must be exactly 6 characters (letters/numbers).\n • If join fails,
              verify Firestore is created and rules are published.\n • If you see permission-denied,
              publish `firestore.rules`.\n • For Google sign-in issues, confirm all
              `EXPO_PUBLIC_GOOGLE_*` IDs and rebuild the native app.
            </Text>
          </Card>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-primary mb-2">Documentation</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                openUrl(
                  "https://github.com/mehedihassandev/Family-Grocery-List/blob/main/FIRESTORE_RULES_SETUP.md",
                )
              }
              className="flex-row items-center justify-between rounded-2xl border border-border-muted bg-surface px-4 py-3"
            >
              <Text className="text-[14px] font-semibold text-text-primary">
                Firestore rules setup
              </Text>
              <ExternalLink stroke="#637889" size={18} />
            </TouchableOpacity>

            <View className="h-3" />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                openUrl(
                  "https://github.com/mehedihassandev/Family-Grocery-List/blob/main/GOOGLE_SIGNIN_SETUP.md",
                )
              }
              className="flex-row items-center justify-between rounded-2xl border border-border-muted bg-surface px-4 py-3"
            >
              <Text className="text-[14px] font-semibold text-text-primary">
                Google sign-in setup
              </Text>
              <ExternalLink stroke="#637889" size={18} />
            </TouchableOpacity>
          </Card>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-primary mb-2">Contact support</Text>
            <Text className="text-[13px] leading-5 text-text-secondary mb-3">
              The fastest way to get help is to open a GitHub issue with screenshots and the exact
              error message.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                openUrl(
                  "https://github.com/mehedihassandev/Family-Grocery-List/issues/new?template=bug_report.yml",
                )
              }
              className="flex-row items-center justify-between rounded-2xl bg-primary-600 px-4 py-3"
            >
              <View className="flex-row items-center">
                <Bug stroke="#f6fbf7" size={18} />
                <Text className="ml-2 text-[14px] font-bold text-text-inverse">Report a bug</Text>
              </View>
              <ExternalLink stroke="#f6fbf7" size={18} />
            </TouchableOpacity>
          </Card>

          <Card className="p-5">
            <View className="flex-row items-center mb-2">
              <Info stroke="#637889" size={18} />
              <Text className="ml-2 text-[16px] font-bold text-text-primary">App info</Text>
            </View>
            <Text className="text-[13px] leading-5 text-text-secondary">
              Family Grocery List is built with Expo + React Native and uses Firebase Authentication
              and Cloud Firestore for real-time sync.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;
