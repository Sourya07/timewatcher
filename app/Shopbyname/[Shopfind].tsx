import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useShopStore, Shop } from "@/Store/shopstore";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";

export default function ShopByName() {
    const router = useRouter();
    // Dynamic route file is [Shopfind].tsx → Expo Router uses 'Shopfind' as the param key
    const { Shopfind: name } = useLocalSearchParams<{ Shopfind: string }>();
    const { getShopByname, fetchShops, shops, loading } = useShopStore();
    const [foundShops, setFoundShops] = useState<Shop[]>([]);

    useEffect(() => {
        if (!name) return;
        async function fetchAndFind() {
            // fetchShops now returns the list, avoiding stale-state closure bug
            let allShops = getShopByname(name);
            if (allShops.length === 0) {
                const fetched = await fetchShops();
                allShops = fetched.filter(
                    (shop) => shop.occupation.toLowerCase() === (name as string).toLowerCase()
                );
            }
            setFoundShops(allShops);
        }
        fetchAndFind();
    }, [name]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#FE8C00" />
                <Text className="mt-4 text-gray-400 font-semibold">Loading shops...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView>
                {/* Header */}
                <View className="px-5 py-4 pt-12">
                    <View className="flex-row justify-between items-center bg-white shadow-xl shadow-black/5 p-4 rounded-3xl border border-gray-100">
                        <View className="flex-row items-center">
                            <TouchableOpacity onPress={() => router.back()} className="bg-gray-50 p-3 rounded-full mr-3">
                                <Ionicons name="arrow-back" size={20} color="#111827" />
                            </TouchableOpacity>
                            <View>
                                <Text className="text-2xl font-black text-[#1a1a1a] tracking-tight">{name}</Text>
                                <Text className="text-gray-500 text-xs font-semibold mt-0.5">3.8 km · Gaur City 1</Text>
                            </View>
                        </View>
                        <View className="bg-orange-100 rounded-full px-4 py-2 flex-row flex-center">
                            <AntDesign name="star" size={14} color="#FE8C00" />
                            <Text className="text-[#FE8C00] font-bold ml-1">4.4</Text>
                        </View>
                    </View>
                </View>

                {/* Filters */}
                <View className="flex-row px-5 py-2 space-x-3 mt-2">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity className="px-5 py-2.5 bg-gray-900 rounded-full shadow-lg shadow-black/30 mr-3">
                            <Text className="text-white font-bold">Sort By</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="px-5 py-2.5 bg-white border border-gray-200 rounded-full mr-3">
                            <Text className="text-gray-600 font-bold">Top Rated</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="px-5 py-2.5 bg-white border border-gray-200 rounded-full mr-3">
                            <Text className="text-gray-600 font-bold">Near Me</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Template Categories */}
                <View className="px-5 py-4">
                    <Text className="text-xl font-bold tracking-tight text-[#1a1a1a] mb-4">Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {["Doctors", "Advocate", "Courier", "Barber"].map((cat, idx) => (
                            <TouchableOpacity
                                key={idx}
                                className="mr-4 items-center"
                            >
                                <View className="w-16 h-16 rounded-3xl bg-orange-50 justify-center items-center shadow-sm shadow-orange-100/50 border border-orange-100">
                                    <Ionicons name="medkit" size={24} color="#FE8C00" />
                                </View>
                                <Text className="mt-2 text-xs font-bold text-gray-700">{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Shops Section */}
                <View className="px-5 py-4 pb-32">
                    <Text className="text-xl font-bold tracking-tight text-[#1a1a1a] mb-4">Available {name}s</Text>
                    {foundShops.length === 0 && !loading ? (
                        <View className="items-center py-16">
                            <Ionicons name="storefront-outline" size={52} color="#D1D5DB" />
                            <Text className="text-gray-400 text-base font-bold mt-4">No {name} shops found</Text>
                            <Text className="text-gray-300 text-sm mt-1">Be the first to register!</Text>
                        </View>
                    ) : foundShops.map((shop) => (
                        <TouchableOpacity
                            key={shop.id}
                            onPress={() => router.push(`/shops/${shop.id}` as any)}
                            className="mb-6 bg-white rounded-3xl shadow-xl shadow-black/10 border border-gray-100 overflow-hidden active:scale-[0.98]"
                        >
                            {shop.image ? (
                                <Image
                                    source={{ uri: shop.image }}
                                    className="w-full h-48 bg-gray-100"
                                    resizeMode="cover"
                                />
                            ) : null}
                            <View className="p-5">
                                <View className="flex-row justify-between items-start">
                                    <View>
                                        <Text className="text-xl font-black text-[#1a1a1a] tracking-tight">{shop.name}</Text>
                                        <Text className="text-gray-500 font-semibold text-sm mt-0.5">{shop.speclization}</Text>
                                    </View>
                                    <View className="bg-orange-50 px-3 py-1.5 rounded-full">
                                        <Text className="text-[#FE8C00] font-bold text-sm">₹{shop.price}/m</Text>
                                    </View>
                                </View>
                                <View className="mt-4 flex-row items-center">
                                    <Ionicons name="location-sharp" size={16} color="#9ca3af" />
                                    <Text className="ml-1 text-gray-400 font-semibold text-xs uppercase tracking-wider">{shop.address}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
            
            {/* Bottom Search + Menu */}
            <View className="absolute left-5 right-5 bottom-8 flex-row items-center justify-between">
                <View className="flex-row items-center bg-white shadow-2xl shadow-black/30 border border-gray-100 flex-1 rounded-full px-5 py-4 mr-3">
                    <Ionicons name="search" size={20} color="#9ca3af" />
                    <TextInput
                        placeholder="Search for a specialist..."
                        className="ml-3 flex-1 text-[#1a1a1a] font-semibold"
                        placeholderTextColor="#9ca3af"
                        selectionColor="#FE8C00"
                    />
                </View>
                <TouchableOpacity className="bg-[#1a1a1a] shadow-2xl shadow-black/40 p-4 rounded-full flex-center size-14">
                    <MaterialIcons name="menu-book" size={24} color="white" />
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}
