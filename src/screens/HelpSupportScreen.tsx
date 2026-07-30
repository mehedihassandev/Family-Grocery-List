import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HelpCircle, Bug, ExternalLink } from "lucide-react-native";
import { SubHeader } from "../components/ui";
import { AuthenticatedStackNavigatorScreenProps, ROUTES } from "../types";
import { useAppTheme } from "../hooks";

interface IBulletListProps {
  items: string[];
}

const BulletList = ({ items }: IBulletListProps) => {
  const { colors } = useAppTheme();
  return (
    <View className="gap-2.5 mt-2">
      {items.map((item) => (
        <View key={item} className="flex-row items-start">
          <View className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-500 mr-2.5" />
          <Text
            className="flex-1 text-[13px] leading-5 font-medium"
            style={{ color: colors.textSecondary }}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
};

/**
 * Flat Help & Support Screen
 * Why: Pure canvas, readable typography, dark mode theme support.
 */
const HelpSupportScreen = ({
  navigation,
}: AuthenticatedStackNavigatorScreenProps<typeof ROUTES.HELP_SUPPORT>) => {
  const { colors } = useAppTheme();

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
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: colors.bgCanvas }}
    >
      <SubHeader title="Help & Support" onBackPress={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.bgCanvas }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-6">
          <View className="items-center mb-8 pb-6 border-b" style={{ borderColor: colors.border }}>
            <View
              className="h-16 w-16 items-center justify-center rounded-full mb-3 border"
              style={{ backgroundColor: colors.infoLight, borderColor: colors.border }}
            >
              <HelpCircle stroke={colors.info} size={30} />
            </View>
            <Text
              className="text-[22px] font-black mb-1 text-center"
              style={{ color: colors.textPrimary }}
            >
              Need Assistance?
            </Text>
            <Text
              className="text-[13px] text-center leading-5 px-4 font-medium"
              style={{ color: colors.textSecondary }}
            >
              Quick solutions and technical support for your family account.
            </Text>
          </View>

          {/* Section 1 */}
          <View className="mb-6 pb-6 border-b" style={{ borderColor: colors.border }}>
            <Text className="text-[16px] font-extrabold mb-1" style={{ color: colors.textPrimary }}>
              Common Fixes
            </Text>
            <BulletList
              items={[
                "Invite code must be exactly 6 characters (letters & numbers).",
                "If joining fails, ensure Firestore database is provisioned.",
                "If permission-denied appears, verify Firestore rules deployment.",
                "For Google Sign-In, confirm matching web & iOS/Android client IDs.",
              ]}
            />
          </View>

          {/* Section 2 */}
          <View className="mb-6 pb-6 border-b" style={{ borderColor: colors.border }}>
            <Text className="text-[16px] font-extrabold mb-2" style={{ color: colors.textPrimary }}>
              Setup Guides
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openUrl(
                  "https://github.com/mehedihassandev/Family-Grocery-List/blob/main/FIRESTORE_RULES_SETUP.md",
                )
              }
              className="flex-row items-center justify-between py-3 border-b"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                Firestore Rules Guide
              </Text>
              <ExternalLink stroke={colors.icon} size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                openUrl(
                  "https://github.com/mehedihassandev/Family-Grocery-List/blob/main/GOOGLE_SIGNIN_SETUP.md",
                )
              }
              className="flex-row items-center justify-between py-3"
            >
              <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                Google Sign-In Guide
              </Text>
              <ExternalLink stroke={colors.icon} size={16} />
            </TouchableOpacity>
          </View>

          {/* Section 3 */}
          <View className="mb-6">
            <Text
              className="text-[16px] font-extrabold mb-1.5"
              style={{ color: colors.textPrimary }}
            >
              Report an Issue
            </Text>
            <Text
              className="text-[13px] leading-5 font-medium mb-4"
              style={{ color: colors.textSecondary }}
            >
              Open a GitHub issue with details or screenshots for technical bug resolution.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                openUrl(
                  "https://github.com/mehedihassandev/Family-Grocery-List/issues/new?template=bug_report.yml",
                )
              }
              className="flex-row items-center justify-center rounded-full bg-emerald-600 py-3.5"
            >
              <Bug stroke="white" size={16} strokeWidth={2.5} className="mr-2" />
              <Text className="text-[13px] font-bold text-white">Report a Bug on GitHub</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;
