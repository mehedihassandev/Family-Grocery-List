import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, User as UserIcon } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import MembersScreen from '../screens/MembersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#0ea5e9',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                    height: 85,
                    paddingTop: 10,
                    paddingBottom: 25,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                }
            }}
        >
            <Tab.Screen 
                name="List" 
                component={HomeScreen} 
                options={{
                    tabBarIcon: ({ color, size }) => <Home stroke={color} size={size} />,
                }}
            />
            <Tab.Screen 
                name="Members" 
                component={MembersScreen} 
                options={{
                    tabBarIcon: ({ color, size }) => <Users stroke={color} size={size} />,
                }}
            />
            <Tab.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{
                    tabBarIcon: ({ color, size }) => <UserIcon stroke={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
