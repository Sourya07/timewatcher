import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useShopStore } from '@/Store/shopstore';

export default function Cart() {
    const { shops, fetchShops, loading } = useShopStore();
    const [search, setSearch] = useState('');
    const [filtershops, setFiltershops] = useState(shops);

    useEffect(() => {
        setFiltershops(shops);
    }, [shops]);

    const handleSearch = (text: string) => {
        setSearch(text);
        if (text.trim() === '') {
            setFiltershops(shops);
        } else {
            const lower = text.toLowerCase();
            const filtered = shops.filter(
                (shop) =>
                    shop.occupation.toLowerCase().includes(lower) ||
                    (shop.name && shop.name.toLowerCase().includes(lower))
            );
            setFiltershops(filtered);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="green" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 px-4 pt-2 bg-white">
            {/* Search Bar */}
            <View className="flex-row items-center mb-4">
                <TextInput
                    placeholder="Search by name or occupation"
                    value={search}
                    onChangeText={handleSearch}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-base"
                />
                <TouchableOpacity className="ml-2">
                    <Ionicons name="mic-outline" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity className="ml-2 px-2 py-1 border rounded-full border-green-600">
                    <Text className="text-green-600 font-medium text-sm">VEG</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="space-y-4">
                {filtershops.map((item) => (
                    <Pressable
                        key={item.id}
                        onPress={() => router.push(`/shops/${item.id}`)}
                        className="flex-row bg-white border border-gray-100 rounded-xl shadow-sm p-3"
                    >
                        <Image
                            source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                            className="w-24 h-24 rounded-lg mr-4"
                        />
                        <View className="flex-1">
                            <View className="flex-row items-center justify-between">
                                <Text className="text-lg font-bold">{item.name || item.occupation}</Text>
                                <Feather name="heart" size={20} color="gray" />
                            </View>

                            <View className="flex-row items-center space-x-1 mt-1">
                                <MaterialIcons name="check-circle" size={16} color="green" />
                                <Text className="text-xs text-green-700 font-medium">Verified</Text>
                            </View>

                            <Text className="text-sm text-gray-600 mt-1">📍 {item.address}</Text>
                            <Text className="text-sm text-gray-500">📞 {item.mobilenumber}</Text>
                            <Text className="text-sm text-gray-500">
                                ⏱ {item.timein} - {item.timeout} mins
                            </Text>

                            <View className="flex-row items-center justify-between mt-1">
                                <Text className="text-sm font-semibold text-black">PRICE ₹{item.price}</Text>
                                <Text className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                    Special Offer
                                </Text>
                            </View>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}