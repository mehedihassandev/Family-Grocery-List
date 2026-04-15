import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Image, ScrollView } from 'react-native';
import { LogOut, Settings, Bell, Shield, HelpCircle, ChevronRight, User as UserIcon } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { signOut } from '../services/auth';

const ProfileScreen = () => {
  const { user } = useAuthStore();

  const menuItems = [
    { icon: Bell, title: 'Notifications', color: 'bg-blue-50 text-blue-600' },
    { icon: Shield, title: 'Privacy & Security', color: 'bg-emerald-50 text-emerald-600' },
    { icon: HelpCircle, title: 'Help & Support', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-white px-8 pt-12 pb-8 items-center rounded-b-[50px]">
          <View className="w-24 h-24 bg-primary-100 rounded-full items-center justify-center mb-4 overflow-hidden border-4 border-white">
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="w-full h-full" />
            ) : (
              <UserIcon stroke="#0ea5e9" size={40} />
            )}
          </View>
          <Text className="text-2xl font-bold text-gray-900">{user?.displayName}</Text>
          <Text className="text-gray-400 font-medium mb-6">{user?.email}</Text>
          
          <TouchableOpacity className="bg-primary-50 px-6 py-2 rounded-full">
            <Text className="text-primary-600 font-bold text-sm">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Menu */}
        <View className="p-6">
          <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-4 ml-2">Preferences</Text>
          <View className="bg-white rounded-[30px] p-2 border border-gray-100 mb-8">
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index}
                className={`flex-row items-center p-4 ${index !== menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <View className={`p-2 rounded-xl mr-4 ${item.color.split(' ')[0]}`}>
                  <item.icon stroke={item.color.split(' ')[1].replace('text-', '')} size={20} />
                </View>
                <Text className="flex-1 text-gray-700 font-semibold">{item.title}</Text>
                <ChevronRight stroke="#d1d5db" size={20} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            onPress={() => signOut()}
            className="bg-red-50 flex-row items-center p-5 rounded-[30px] border border-red-100"
          >
            <View className="bg-red-100 p-2 rounded-xl mr-4">
              <LogOut stroke="#ef4444" size={20} />
            </View>
            <Text className="flex-1 text-red-600 font-bold text-lg">Sign Out</Text>
            <ChevronRight stroke="#fca5a5" size={20} />
          </TouchableOpacity>

          <View className="mt-12 items-center">
            <Text className="text-gray-300 text-xs font-medium uppercase tracking-widest">Family Grocery v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
