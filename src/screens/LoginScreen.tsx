import React from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView } from 'react-native';
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
      // Fallback to mock for development if needed
      // await mockSignIn();
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
      <View className="flex-1 px-8 justify-center items-center">
        <View
          className="w-24 h-24 bg-primary-100 rounded-3xl items-center justify-center mb-8"
        >
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3724/3724720.png' }} 
            className="w-16 h-16"
          />
        </View>
        
        <Text className="text-4xl font-bold text-gray-900 text-center mb-2">
          Family Grocery
        </Text>
        <Text className="text-lg text-gray-500 text-center mb-12">
          Collaborate with your family to never miss an item again.
        </Text>

        <TouchableOpacity 
          onPress={handleGoogleSignIn}
          className="w-full bg-white border border-gray-200 flex-row items-center justify-center py-4 rounded-2xl mb-4"
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} 
            className="w-6 h-6 mr-3"
          />
          <Text className="text-lg font-semibold text-gray-700">Sign in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleMockSignIn}
          className="w-full bg-primary-600 flex-row items-center justify-center py-4 rounded-2xl"
        >
          <View style={{ marginRight: 12 }}><LogIn stroke="white" size={20} /></View>
          <Text className="text-lg font-semibold text-white">Guest Sign In (Demo)</Text>
        </TouchableOpacity>

        <View className="mt-12">
          <Text className="text-gray-400 text-sm">
            By signing in, you agree to our Terms & Privacy Policy.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
