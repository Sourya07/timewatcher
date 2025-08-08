import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export default function ProfileScreen() {
    interface userdata {
        id: number,
        name: String,
        email: String,
        mobilenumber: String
        avatar: any
        profile: any

    }

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<userdata>();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await SecureStore.getItemAsync('usertoken');
                console.log(token)
                if (!token) {
                    // No token → redirect to sign in
                    router.replace('/(authuser)/sign-in');
                    return;
                }

                // Fetch user data
                const res = await axios.get('http://localhost:3000/api/v1/user/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData(res.data);
                console.log(res.data)
            } catch (error: any) {
                console.log('Auth check failed:', error.message);
                router.replace('/(authuser)/sign-in');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#000" />
            </SafeAreaView>
        );
    }

    if (!userData) {
        return null; // Nothing to render if redirected
    }

    return (
        <SafeAreaView className="bg-[#f0f0f0] flex-1">
            <ScrollView className="px-4">
                {/* Top Section */}
                <View className="items-center mt-6">
                    <Image
                        source={{ uri: userData.profile.image || 'https://via.placeholder.com/150' }}
                        className="w-20 h-20 rounded-full border-2 border-white"
                    />
                </View>

                {/* Name and Username */}
                <View className="items-center mt-4">
                    <Text className="text-black text-lg font-bold">{userData.name}</Text>
                    <Text className="text-gray-500 text-sm mt-1">{userData.email}</Text>
                </View>

                {/* Edit Profile Button */}
                <Pressable className="bg-indigo-500 mx-4 mt-6 py-2 rounded-full items-center">
                    <Text className="text-white font-semibold">Edit Profile</Text>
                </Pressable>

                {/* Example settings */}
                <View className="mt-10 space-y-4">
                    <View className="bg-white p-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm">Member Since</Text>
                        <Text className="text-black mt-1">👾 {userData.profile.address}</Text>
                    </View>

                </View>
                <View className="mt-5 space-y-4">
                    <View className="bg-white p-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm">Member Since</Text>
                        <Text className="text-black mt-1">👾 {userData.profile.mobilenumber}</Text>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}