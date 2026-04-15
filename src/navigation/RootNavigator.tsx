import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { listenToAuthChanges } from '../services/auth';

import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';
import FamilySetupScreen from '../screens/FamilySetupScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { user, loading } = useAuthStore();

    useEffect(() => {
        const unsubscribe = listenToAuthChanges();
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                <ActivityIndicator size="large" color="#0ea5e9" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Login" component={LoginScreen} />
                ) : !user.familyId ? (
                    <Stack.Screen name="FamilySetup" component={FamilySetupScreen} />
                ) : (
                    <Stack.Screen name="Main" component={TabNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
