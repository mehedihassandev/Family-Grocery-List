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
                tabBarActiveTintColor: '#10b981',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 25,
                    left: 20,
                    right: 20,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 30,
                    height: 70,
                    paddingBottom: 12,
                    paddingTop: 12,
                    borderTopWidth: 0,
                    // Shadow for premium feel
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    elevation: 5,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                    marginTop: -5,
                }
            }}
        >
            <Tab.Screen 
                name="List" 
                component={HomeScreen} 
                options={{
                    tabBarIcon: ({ color, size }) => <Home stroke={color} size={22} strokeWidth={2.5} />,
                }}
            />
            <Tab.Screen 
                name="Members" 
                component={MembersScreen} 
                options={{
                    tabBarIcon: ({ color, size }) => <Users stroke={color} size={22} strokeWidth={2.5} />,
                }}
            />
            <Tab.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{
                    tabBarIcon: ({ color, size }) => <UserIcon stroke={color} size={22} strokeWidth={2.5} />,
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;
