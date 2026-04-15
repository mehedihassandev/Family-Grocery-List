import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  Image, 
  TouchableOpacity,
  Share,
  ActivityIndicator
} from 'react-native';
import { Copy, Share2, Crown, User as UserIcon } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { subscribeToFamilyMembers, getFamilyDetails } from '../services/family';
import { User, Family } from '../types';

const MembersScreen = () => {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<User[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.familyId) return;

    // Fetch family details (invite code)
    getFamilyDetails(user.familyId).then(setFamily);

    // Subscribe to members
    const unsubscribe = subscribeToFamilyMembers(user.familyId, (newMembers) => {
      setMembers(newMembers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.familyId]);

  const handleShare = async () => {
    if (!family) return;
    try {
      await Share.share({
        message: `Join our family grocery list! Use invite code: ${family.inviteCode}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-6 bg-white border-b border-gray-100">
        <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Family Group</Text>
        <Text className="text-2xl font-bold text-gray-900">{family?.name || 'Loading...'}</Text>
      </View>

      <View className="p-6">
        {/* Invite Card */}
        <View className="bg-primary-600 p-6 rounded-[30px] mb-8">
          <Text className="font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Invite Family Members</Text>
          <View className="flex-row items-center justify-between p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="text-white text-3xl font-bold tracking-widest">{family?.inviteCode}</Text>
            <TouchableOpacity onPress={handleShare} className="bg-white p-3 rounded-xl">
              <Share2 stroke="#0284c7" size={20} />
            </TouchableOpacity>
          </View>
          <Text className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Share this code with your family to let them join this shared workspace.
          </Text>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-4">Family Members ({members.length})</Text>
        
        {loading ? (
          <ActivityIndicator color="#0ea5e9" />
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => (
              <View className="flex-row items-center bg-white p-4 rounded-2xl mb-3 border border-gray-100">
                <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mr-4 overflow-hidden border border-primary-200">
                  {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} className="w-full h-full" />
                  ) : (
                    <UserIcon stroke="#0ea5e9" size={24} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-base">{item.displayName}</Text>
                  <Text className="text-gray-400 text-xs">{item.email}</Text>
                </View>
                {item.role === 'owner' && (
                  <View className="bg-amber-100 px-3 py-1 rounded-full flex-row items-center">
                    <View style={{ marginRight: 4 }}><Crown stroke="#d97706" size={12} /></View>
                    <Text className="text-amber-700 text-[10px] font-bold uppercase">Owner</Text>
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default MembersScreen;
