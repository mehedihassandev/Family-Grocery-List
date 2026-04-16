import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity,
  Share,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView className="flex-1 bg-[#fcfdfd]">
      <View className="px-6 pt-6 pb-6 bg-white border-b border-gray-100">
        <Text className="text-emerald-600 font-bold uppercase tracking-[2px] text-[10px] mb-1">Family Group</Text>
        <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">{family?.name || 'Loading...'}</Text>
      </View>

      <View className="p-6">
        {/* Invite Card */}
        <View className="bg-emerald-600 p-8 rounded-[40px] mb-10 shadow-xl shadow-emerald-100">
          <Text className="font-bold mb-4 tracking-wide" style={{ color: 'rgba(255,255,255,0.9)' }}>INVITE FAMILY MEMBERS</Text>
          <View className="flex-row items-center justify-between p-5 rounded-3xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <Text className="text-white text-3xl font-black tracking-[4px]">{family?.inviteCode}</Text>
            <TouchableOpacity 
              onPress={handleShare} 
              activeOpacity={0.8}
              className="bg-white p-3.5 rounded-2xl shadow-sm"
            >
              <Share2 stroke="#059669" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text className="text-[11px] mt-5 leading-5 font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Share this secret code with your family members to collaborate on your grocery list together.
          </Text>
        </View>

        <Text className="text-xl font-black text-gray-900 mb-5 tracking-tight px-1">Family Members ({members.length})</Text>
        
        {loading ? (
          <ActivityIndicator color="#10b981" size="large" />
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.uid}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View 
                className="flex-row items-center bg-white p-5 rounded-[30px] mb-4 border border-gray-100/50 shadow-sm shadow-gray-200/50"
                style={{
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                }}
              >
                <View className="w-14 h-14 bg-emerald-50 rounded-full items-center justify-center mr-4 overflow-hidden border-2 border-white shadow-sm">
                  {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} className="w-full h-full" />
                  ) : (
                    <UserIcon stroke="#10b981" size={26} strokeWidth={2} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold text-lg tracking-tight">{item.displayName}</Text>
                  <Text className="text-gray-400 text-xs font-medium">{item.email}</Text>
                </View>
                {item.role === 'owner' && (
                  <View className="bg-amber-50 px-4 py-1.5 rounded-full flex-row items-center border border-amber-100/50">
                    <Crown stroke="#d97706" size={12} strokeWidth={2.5} className="mr-1.5" />
                    <Text className="text-amber-700 text-[10px] font-black uppercase tracking-widest">Owner</Text>
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
