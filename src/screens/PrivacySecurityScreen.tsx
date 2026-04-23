import React from "react";
import { View, Text, ScrollView, Linking, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shield, ExternalLink } from "lucide-react-native";
import { SubHeader, Card } from "../components/ui";

const PrivacySecurityScreen = () => {
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
              <Shield stroke="#59AC77" size={32} />
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
            <Text className="text-[16px] font-bold text-text-primary mb-2">What data we store</Text>
            <Text className="text-[13px] leading-5 text-text-secondary">
              • Account profile: your UID, email, display name, and optional photo URL.\n • Family
              membership: which family you belong to and your role (owner/member).\n • Grocery data:
              items, categories, and notifications inside your family.
            </Text>
          </Card>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-primary mb-2">
              How access is protected
            </Text>
            <Text className="text-[13px] leading-5 text-text-secondary">
              • Sign-in is required for all app data.\n • Firestore Security Rules scope
              reads/writes to your family (by familyId).\n • Data is transmitted over encrypted
              connections (TLS) and stored in Firebase.
            </Text>
          </Card>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-primary mb-2">Local storage</Text>
            <Text className="text-[13px] leading-5 text-text-secondary">
              The app persists your signed-in session on your device using AsyncStorage so you don’t
              need to log in every time.
            </Text>
          </Card>

          <Card className="p-5 mb-4">
            <Text className="text-[16px] font-bold text-text-primary mb-2">
              Third-party services
            </Text>
            <Text className="text-[13px] leading-5 text-text-secondary mb-3">
              This app relies on Google Sign-In (optional) and Firebase (Auth + Firestore). Their
              privacy policies also apply.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openUrl("https://firebase.google.com/support/privacy")}
              className="flex-row items-center justify-between rounded-2xl border border-border-muted bg-surface px-4 py-3"
            >
              <Text className="text-[14px] font-semibold text-text-primary">Firebase privacy</Text>
              <ExternalLink stroke="#637889" size={18} />
            </TouchableOpacity>

            <View className="h-3" />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => openUrl("https://policies.google.com/privacy")}
              className="flex-row items-center justify-between rounded-2xl border border-border-muted bg-surface px-4 py-3"
            >
              <Text className="text-[14px] font-semibold text-text-primary">Google privacy</Text>
              <ExternalLink stroke="#637889" size={18} />
            </TouchableOpacity>
          </Card>

          <Card className="p-5">
            <Text className="text-[16px] font-bold text-text-primary mb-2">Important note</Text>
            <Text className="text-[13px] leading-5 text-text-secondary">
              We use industry-standard safeguards (Firebase Auth, encrypted transport, and Firestore
              Security Rules) to protect your data. No internet-connected service can guarantee
              absolute (100%) security, but we work hard to keep your data protected.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacySecurityScreen;
