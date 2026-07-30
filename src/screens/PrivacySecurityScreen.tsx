import React from "react";
import { View, Text, ScrollView, Linking, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shield, ExternalLink } from "lucide-react-native";
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
          <View className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2.5" />
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
 * Flat Privacy & Security Screen
 * Why: Pure canvas, readable typography, dark mode theme support.
 */
const PrivacySecurityScreen = ({
  navigation,
}: AuthenticatedStackNavigatorScreenProps<typeof ROUTES.PRIVACY_SECURITY>) => {
  const { colors } = useAppTheme();

  const openUrl = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1"
      style={{ backgroundColor: colors.bgCanvas }}
    >
      <SubHeader title="Privacy & Security" onBackPress={() => navigation.goBack()} />

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.bgCanvas }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-6">
          <View className="items-center mb-8 pb-6 border-b" style={{ borderColor: colors.border }}>
            <View
              className="h-16 w-16 items-center justify-center rounded-full mb-3 border"
              style={{ backgroundColor: colors.accentMuted, borderColor: colors.border }}
            >
              <Shield stroke={colors.accent} size={30} />
            </View>
            <Text
              className="text-[22px] font-black mb-1 text-center"
              style={{ color: colors.textPrimary }}
            >
              Your Privacy Matters
            </Text>
            <Text
              className="text-[13px] text-center leading-5 px-4 font-medium"
              style={{ color: colors.textSecondary }}
            >
              Family Grocery List uses Firebase Authentication and Cloud Firestore to securely sync
              your list.
            </Text>
          </View>

          {/* Section 1 */}
          <View className="mb-6 pb-6 border-b" style={{ borderColor: colors.border }}>
            <Text className="text-[16px] font-extrabold mb-1" style={{ color: colors.textPrimary }}>
              What Data We Store
            </Text>
            <BulletList
              items={[
                "Account Profile: UID, email address, display name, and photo.",
                "Family Membership: Group ID and assigned role.",
                "Grocery Data: Items, categories, and family activity logs.",
              ]}
            />
          </View>

          {/* Section 2 */}
          <View className="mb-6 pb-6 border-b" style={{ borderColor: colors.border }}>
            <Text className="text-[16px] font-extrabold mb-1" style={{ color: colors.textPrimary }}>
              How Access is Protected
            </Text>
            <BulletList
              items={[
                "Authentication is required for all data endpoints.",
                "Firestore Security Rules strictly scope data to your family group.",
                "Data transmission is protected via TLS encryption.",
              ]}
            />
          </View>

          {/* Section 3 */}
          <View className="mb-6 pb-6 border-b" style={{ borderColor: colors.border }}>
            <Text
              className="text-[16px] font-extrabold mb-1.5"
              style={{ color: colors.textPrimary }}
            >
              Local Storage
            </Text>
            <Text
              className="text-[13px] leading-5 font-medium"
              style={{ color: colors.textSecondary }}
            >
              The app persists your session on your device using AsyncStorage for quick access.
              Avoid using shared devices for sensitive accounts.
            </Text>
          </View>

          {/* Section 4 */}
          <View className="mb-6 pb-6 border-b" style={{ borderColor: colors.border }}>
            <Text
              className="text-[16px] font-extrabold mb-1.5"
              style={{ color: colors.textPrimary }}
            >
              Third-Party Policies
            </Text>
            <Text
              className="text-[13px] leading-5 font-medium mb-3"
              style={{ color: colors.textSecondary }}
            >
              This app relies on Google Sign-In and Firebase (Auth + Firestore). Their privacy
              policies apply to your account data.
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openUrl("https://firebase.google.com/support/privacy")}
              className="flex-row items-center justify-between py-3 border-b"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                Firebase Privacy Policy
              </Text>
              <ExternalLink stroke={colors.icon} size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openUrl("https://policies.google.com/privacy")}
              className="flex-row items-center justify-between py-3"
            >
              <Text className="text-[13px] font-bold" style={{ color: colors.textPrimary }}>
                Google Privacy Policy
              </Text>
              <ExternalLink stroke={colors.icon} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacySecurityScreen;
