import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminShopsScreen() {
    type AdminShop = {
        image: string;
        address: string;
        mobilenumber: string;
        occupation: string;
        speclization: string;
        timein: string;
        timeout: string;
        price: number;
    };

    const [shops, setShops] = useState<AdminShop[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchShops = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (!token) {
                Alert.alert('Authentication Error', 'Please log in again.');
                return;
            }

            const res = await axios.get('https://timewatcher.onrender.com/api/v1/admin/adminshops', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setShops(res.data.shops);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load shops');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" />
                <Text className="mt-2 text-gray-600">Loading shops...</Text>
            </View>
        );
    }

    if (shops.length === 0) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text className="text-lg text-gray-700">No shops found.</Text>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white p-4">
            <SafeAreaView>
                {/* 🔙 Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mb-4"
                >
                    <Text className="text-blue-600 text-base">← Back</Text>
                </TouchableOpacity>

                {/* Shops List */}
                {shops.map((shop, index) => (
                    <View key={index} className="bg-gray-100 rounded-xl p-4 mb-4 shadow">
                        {shop.image && (
                            <Image
                                source={{ uri: shop.image }}
                                className="w-full h-48 rounded-lg mb-3"
                                resizeMode="cover"
                            />
                        )}
                        <Text className="text-lg font-semibold mb-1 text-black">{shop.address}</Text>
                        <Text className="text-gray-700">📞 {shop.mobilenumber}</Text>
                        <Text className="text-gray-700">👤 {shop.occupation}</Text>
                        <Text className="text-gray-700">🔧 {shop.speclization}</Text>
                        <Text className="text-gray-700">🕒 {shop.timein} - {shop.timeout}</Text>
                        <Text className="text-gray-800 font-bold mt-2">💰 ₹{shop.price}</Text>
                    </View>
                ))}
            </SafeAreaView>
        </ScrollView>
    );
}