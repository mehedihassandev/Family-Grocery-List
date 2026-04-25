import React from "react";
import { View, Text, ScrollView, Linking, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shield, ExternalLink } from "lucide-react-native";
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
 * Screen displaying privacy policy and security information
 * Why: To provide transparency to users about how their data is handled and secured within the Firebase ecosystem.
 */
const PrivacySecurityScreen = () => {
  /**
   * Opens an external URL in the default browser
   * @param url - The URL to open
   */
  const openUrl = async (url: string) => {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <SubHeader title="Privacy & Security" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <View className="items-center mb-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50 mb-4">
              <Shield stroke="#3DB87A" size={32} />
            </View>
            <Text className="text-[24px] font-black text-text-primary mb-2 text-center">
              Your privacy matters
            </Text>
            <Text className="text-[15px] text-text-secondary text-center px-4">
              Family Grocery List uses Firebase Authentication and Cloud Firestore to sync your data
              across devices.
            </Text>
          </View>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-900 mb-2">What data we store</Text>
            <BulletList
              items={[
                "Account profile: your UID, email, display name, and photo.",
                "Family membership: your family group ID and your role.",
                "Grocery data: items, categories, and family notifications.",
              ]}
            />
          </Card>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-900 mb-2">
              How access is protected
            </Text>
            <BulletList
              items={[
                "Sign-in is required for all application data access.",
                "Firestore Security Rules scope data to your family group only.",
                "Data is transmitted over encrypted (TLS) connections.",
              ]}
            />
          </Card>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-900 mb-2">Local storage</Text>
            <Text className="text-[13px] leading-5 text-text-secondary">
              The app persists your session on your device using encrypted storage so you don’t
              need to log in every time you open the app.
            </Text>
          </Card>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-900 mb-2">
              Third-party services
            </Text>
            <Text className="text-[13px] leading-5 text-text-secondary mb-4">
              This app relies on Google Sign-In and Firebase (Auth + Firestore). Their
              privacy policies also apply to your data.
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openUrl("https://firebase.google.com/support/privacy")}
              className="flex-row items-center justify-between rounded-md bg-surface-alt border border-border px-4 py-3"
            >
              <Text className="text-[14px] font-bold text-text-900">Firebase Privacy</Text>
              <ExternalLink stroke="#4A5568" size={18} />
            </TouchableOpacity>

            <View className="h-3" />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openUrl("https://policies.google.com/privacy")}
              className="flex-row items-center justify-between rounded-md bg-surface-alt border border-border px-4 py-3"
            >
              <Text className="text-[14px] font-bold text-text-900">Google Privacy</Text>
              <ExternalLink stroke="#4A5568" size={18} />
            </TouchableOpacity>
          </Card>

          <Card className="p-5">
            <Text className="text-[16px] font-bold text-text-900 mb-2">Important Note</Text>
            <Text className="text-[13px] leading-5 text-text-secondary">
              We use industry-standard safeguards to protect your data. While no internet service can 
              guarantee 100% security, we work hard to keep your information safe and private.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacySecurityScreen;
