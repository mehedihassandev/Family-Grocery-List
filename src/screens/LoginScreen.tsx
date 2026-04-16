import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogIn } from 'lucide-react-native';
import { mockSignIn, signInWithGoogle } from '../services/auth';
import { useAuthStore } from '../store/useAuthStore';

const LoginScreen = () => {
  const { setLoading } = useAuthStore();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMockSignIn = async () => {
    setLoading(true);
    await mockSignIn();
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-10 justify-center">
        <View className="items-center mb-16">
          <View
            className="w-28 h-28 bg-emerald-50 rounded-[40px] items-center justify-center mb-10 shadow-sm shadow-emerald-100"
          >
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3724/3724720.png' }} 
              className="w-16 h-16"
            />
          </View>
          
          <Text className="text-4xl font-black text-gray-900 text-center mb-3 tracking-tighter">
            Freshly<Text className="text-emerald-500">.</Text>
          </Text>
          <Text className="text-base text-gray-400 text-center px-4 leading-6 font-medium">
            The elegant way to manage your family grocery list together.
          </Text>
        </View>

        <View className="gap-4">
          <TouchableOpacity 
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            className="w-full border flex-row items-center justify-center py-5 rounded-3xl shadow-sm bg-white border-gray-100 shadow-gray-100"
          >
            <Image 
              source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }} 
              className="w-6 h-6 mr-4"
            />
            <Text className="text-base font-bold text-gray-800">Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleMockSignIn}
            activeOpacity={0.9}
            className="w-full bg-emerald-500 flex-row items-center justify-center py-5 rounded-3xl shadow-lg shadow-emerald-200"
          >
            <LogIn stroke="white" size={20} strokeWidth={2.5} className="mr-3" />
            <Text className="text-base font-bold text-white">Guest Sign In</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-20 items-center">
          <Text className="text-gray-300 text-[10px] font-bold uppercase tracking-[2px]">
            Family Grocery • v1.0.0
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
