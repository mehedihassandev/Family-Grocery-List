import React from "react";
import { View, Text, ScrollView, Linking, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shield, ExternalLink } from "lucide-react-native";
import { SubHeader } from "../components/ui";
import { AuthenticatedStackNavigatorScreenProps, ROUTES } from "../types";

interface IBulletListProps {
  items: string[];
}

const BulletList = ({ items }: IBulletListProps) => {
  return (
    <View className="gap-2.5 mt-2">
      {items.map((item) => (
        <View key={item} className="flex-row items-start">
          <View className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2.5" />
          <Text className="flex-1 text-[13px] leading-5 text-slate-600 font-medium">{item}</Text>
        </View>
      ))}
    </View>
  );
};

/**
 * Flat Privacy & Security Screen
 * Why: Pure white canvas, readable typography, zero card clutter.
 */
const PrivacySecurityScreen = ({
  navigation,
}: AuthenticatedStackNavigatorScreenProps<typeof ROUTES.PRIVACY_SECURITY>) => {
  const openUrl = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <SubHeader title="Privacy & Security" onBackPress={() => navigation.goBack()} />

      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <View className="items-center mb-8 pb-6 border-b border-slate-100">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-3 border border-emerald-100">
              <Shield stroke="#059669" size={30} />
            </View>
            <Text className="text-[22px] font-black text-slate-900 mb-1 text-center">
              Your Privacy Matters
            </Text>
            <Text className="text-[13px] text-slate-500 text-center leading-5 px-4 font-medium">
              Family Grocery List uses Firebase Authentication and Cloud Firestore to securely sync
              your list.
            </Text>
          </View>

          {/* Section 1 */}
          <View className="mb-6 pb-6 border-b border-slate-100">
            <Text className="text-[16px] font-extrabold text-slate-900 mb-1">
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
          <View className="mb-6 pb-6 border-b border-slate-100">
            <Text className="text-[16px] font-extrabold text-slate-900 mb-1">
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
          <View className="mb-6 pb-6 border-b border-slate-100">
            <Text className="text-[16px] font-extrabold text-slate-900 mb-1.5">Local Storage</Text>
            <Text className="text-[13px] leading-5 text-slate-500 font-medium">
              The app persists your session on your device using AsyncStorage for quick access.
              Avoid using shared devices for sensitive accounts.
            </Text>
          </View>

          {/* Section 4 */}
          <View className="mb-6 pb-6 border-b border-slate-100">
            <Text className="text-[16px] font-extrabold text-slate-900 mb-1.5">
              Third-Party Policies
            </Text>
            <Text className="text-[13px] leading-5 text-slate-500 font-medium mb-3">
              This app relies on Google Sign-In and Firebase (Auth + Firestore). Their privacy
              policies apply to your account data.
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openUrl("https://firebase.google.com/support/privacy")}
              className="flex-row items-center justify-between py-3 border-b border-slate-100"
            >
              <Text className="text-[13px] font-bold text-slate-800">Firebase Privacy Policy</Text>
              <ExternalLink stroke="#94A3B8" size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openUrl("https://policies.google.com/privacy")}
              className="flex-row items-center justify-between py-3"
            >
              <Text className="text-[13px] font-bold text-slate-800">Google Privacy Policy</Text>
              <ExternalLink stroke="#94A3B8" size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacySecurityScreen;
