import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // ✅ Settings icon





export default function ProfileScreen() {
    interface userdata {
        id: number,
        name: string,
        email: string,
        mobilenumber: string,
        avatar?: any,
        profile?: any
    }

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<userdata>();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await SecureStore.getItemAsync('usertoken');
                if (!token) {
                    router.replace('/(authuser)/sign-in');
                    return;
                }

                const res = await axios.get('https://timewatcher.onrender.com/api/v1/user/', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUserData(res.data);
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
        return null;
    }

    return (
        <SafeAreaView className="bg-[#f0f0f0] flex-1">
            {/* ✅ Top bar with settings icon */}
            <View className="flex-row justify-end p-4">
                <Pressable onPress={() => router.push('../userflow/setting')}>
                    <Ionicons name="settings-outline" size={28} color="black" />
                </Pressable>
            </View>

            <ScrollView className="px-4">
                {/* Profile Picture */}
                <View className="items-center mt-2">
                    <Image
                        source={{ uri: userData.profile?.image || 'https://via.placeholder.com/150' }}
                        className="w-20 h-20 rounded-full border-2 border-white"
                    />
                </View>

                {/* Name and Email */}
                <View className="items-center mt-4">
                    <Text className="text-black text-lg font-bold">{userData.name}</Text>
                    <Text className="text-gray-500 text-sm mt-1">{userData.email}</Text>
                </View>

                {/* Edit Profile Button */}
                <Pressable className="bg-indigo-500 mx-4 mt-6 py-2 rounded-full items-center" onPress={() => {
                    router.push('../userflow/userdetails')
                }}>
                    <Text className="text-white font-semibold">Edit Profile</Text>
                </Pressable>

                {/* Address */}
                <View className="mt-10 space-y-4">
                    <View className="bg-white p-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm">Address</Text>
                        <Text className="text-black mt-1">🏠 {userData.profile?.address}</Text>
                    </View>
                </View>

                {/* Mobile Number */}
                <View className="mt-5 space-y-4">
                    <View className="bg-white p-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm">Mobile Number</Text>
                        <Text className="text-black mt-1">📱 {userData.profile?.mobilenumber}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}