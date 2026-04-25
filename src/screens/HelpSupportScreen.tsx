import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HelpCircle, Bug, ExternalLink, Info } from "lucide-react-native";
import { SubHeader, Card } from "../components/ui";

interface IBulletListProps {
  items: string[];
}

/**
 * Renders a list of items with bullet points
 * @param props - Component props containing the array of strings to display
 */
const BulletList = ({ items }: IBulletListProps) => {
  return (
    <View className="gap-3">
      {items.map((item) => (
        <View key={item} className="flex-row items-start">
          <View className="mt-2 h-1.5 w-1.5 rounded-full bg-primary-500" />
          <Text className="ml-3 flex-1 text-[13px] leading-5 text-text-secondary">
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

/**
 * Screen providing help resources and support links
 * Why: To guide users through common troubleshooting steps and provide direct links to documentation and bug reporting.
 */
const HelpSupportScreen = () => {
  /**
   * Opens an external URL in the default browser
   * @param url - The URL to open
   */
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
              <HelpCircle stroke="#3DB87A" size={32} />
            </View>
            <Text className="text-[24px] font-black text-text-primary mb-2 text-center">
              Need help?
            </Text>
            <Text className="text-[15px] text-text-secondary text-center px-4">
              Here are quick fixes for the most common issues.
            </Text>
          </View>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-900 mb-2">Common Fixes</Text>
            <BulletList
              items={[
                "Invite code must be exactly 6 characters (letters/numbers).",
                "If join fails, verify Firestore is created and rules are published.",
                "If you see permission-denied, publish `firestore.rules`.",
                "For Google sign-in issues, confirm all `EXPO_PUBLIC_GOOGLE_*` IDs.",
              ]}
            />
          </Card>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-900 mb-2">Documentation</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openUrl(
                  "https://github.com/mehedihassandev/Family-Grocery-List/blob/main/FIRESTORE_RULES_SETUP.md",
                )
              }
              className="flex-row items-center justify-between rounded-md bg-surface-alt border border-border px-4 py-3"
            >
              <Text className="text-[14px] font-bold text-text-900">
                Firestore Rules Setup
              </Text>
              <ExternalLink stroke="#4A5568" size={18} />
            </TouchableOpacity>

            <View className="h-3" />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openUrl(
                  "https://github.com/mehedihassandev/Family-Grocery-List/blob/main/GOOGLE_SIGNIN_SETUP.md",
                )
              }
              className="flex-row items-center justify-between rounded-md bg-surface-alt border border-border px-4 py-3"
            >
              <Text className="text-[14px] font-bold text-text-900">
                Google Sign-In Setup
              </Text>
              <ExternalLink stroke="#4A5568" size={18} />
            </TouchableOpacity>
          </Card>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-900 mb-2">Contact Support</Text>
            <Text className="text-[13px] leading-5 text-text-secondary mb-4">
              The fastest way to get help is to open a GitHub issue with screenshots and the exact
              error message you are seeing.
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openUrl(
                  "https://github.com/mehedihassandev/Family-Grocery-List/issues/new?template=bug_report.yml",
                )
              }
              className="flex-row items-center justify-center rounded-full bg-primary-500 py-3 shadow-green"
            >
              <View className="flex-row items-center">
                <Bug stroke="white" size={18} strokeWidth={2.5} />
                <Text className="ml-2 text-[14px] font-bold text-white">Report a Bug</Text>
              </View>
            </TouchableOpacity>
          </Card>

          <Card className="p-5">
            <View className="flex-row items-center mb-2">
              <Info stroke="#4A5568" size={18} strokeWidth={2.5} />
              <Text className="ml-2 text-[16px] font-bold text-text-900">App Information</Text>
            </View>
            <Text className="text-[13px] leading-5 text-text-secondary">
              Family Grocery List is built with Expo and React Native. It uses Firebase Authentication
              and Cloud Firestore for real-time synchronization.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;
