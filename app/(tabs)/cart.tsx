// app/index.tsx (or your main page)
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { router } from 'expo-router';
import { useShopStore } from '@/Store/shopstore';


export default function App() {
    const { shops, setShops } = useShopStore();
    const [filtershops, setfiltershops] = useState(shops);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>("");
    console.log("j")
    console.log(shops)
    useEffect(() => {
        if (shops.length === 0) {
            fetchShops();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchShops = async () => {
        try {
            console.log("helllo oop")


            const res = await axios.get("https://timewatcher.onrender.com/api/v1/user/adminshops")
            console.log(res.data)
            console.log("kl")
            console.log(res)
            setShops(res.data.shops || []);
            setfiltershops(res.data.shops || []);
        } catch (error) {
            console.error("Error fetching shops:", error);
        } finally {
            setLoading(false);
        }
    };


    const handleSearch = (text: string) => {
        setSearch(text);
        if (text.trim() === "") {
            setfiltershops(shops);
        } else {
            const lower = text.toLowerCase();
            const filtered = shops.filter(
                (shop) =>
                    shop.occupation.toLowerCase().includes(lower) ||
                    (shop.name && shop.name.toLowerCase().includes(lower))
            );
            setfiltershops(filtered);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white px-4 pt-2">
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

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="green" />
                </View>
            ) : (
                <ScrollView className="space-y-4">
                    {filtershops.map((item, index) => (
                        <Pressable
                            key={index}
                            onPress={() => router.push(`/shops/${item.id}`

                            )} // just send index
                            className="flex-row bg-white border border-gray-100 rounded-xl shadow-sm p-3"
                        >
                            <Image
                                source={{
                                    uri: item.image || "https://via.placeholder.com/100",
                                }}
                                className="w-24 h-24 rounded-lg mr-4"
                            />
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-lg font-bold">
                                        {item.name || item.occupation}
                                    </Text>
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
                                    <Text className="text-sm font-semibold text-black">
                                        PRICE ₹{item.price}
                                    </Text>
                                    <Text className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                        Special Offer
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
