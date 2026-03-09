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
import { useThemeStore } from "@/Store/themeStore";

export default function ShopByName() {
    const router = useRouter();
    // Dynamic route file is [Shopfind].tsx → Expo Router uses 'Shopfind' as the param key
    const { Shopfind: name } = useLocalSearchParams<{ Shopfind: string }>();
    const { getShopByname, fetchShops, shops, loading } = useShopStore();
    const { colors } = useThemeStore();
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
            <SafeAreaView
                className="flex-1 justify-center items-center"
                style={{ backgroundColor: colors.background }}
            >
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-4 font-semibold" style={{ color: colors.textMuted }}>
                    Loading shops...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
            <ScrollView>
                {/* Header */}
                <View className="px-5 py-4 pt-12">
                    <View
                        className="flex-row justify-between items-center shadow-xl shadow-black/5 p-4 rounded-3xl border"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    >
                        <View className="flex-row items-center">
                            <TouchableOpacity onPress={() => router.back()} className="bg-gray-50 p-3 rounded-full mr-3">
                                <Ionicons name="arrow-back" size={20} color={colors.text} />
                            </TouchableOpacity>
                            <View>
                                <Text
                                    className="text-2xl font-black tracking-tight"
                                    style={{ color: colors.text }}
                                >
                                    {name}
                                </Text>
                                <Text
                                    className="text-xs font-semibold mt-0.5"
                                    style={{ color: colors.textMuted }}
                                >
                                    3.8 km · Gaur City 1
                                </Text>
                            </View>
                        </View>
                        <View
                            className="rounded-full px-4 py-2 flex-row flex-center"
                            style={{ backgroundColor: colors.background }}
                        >
                            <AntDesign name="star" size={14} color={colors.primary} />
                            <Text className="font-bold ml-1" style={{ color: colors.primary }}>
                                4.4
                            </Text>
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
                    <Text
                        className="text-xl font-bold tracking-tight mb-4"
                        style={{ color: colors.text }}
                    >
                        Categories
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {["Doctors", "Advocate", "Courier", "Barber"].map((cat, idx) => (
                            <TouchableOpacity
                                key={idx}
                                className="mr-4 items-center"
                            >
                                <View
                                    className="w-16 h-16 rounded-3xl justify-center items-center shadow-sm"
                                    style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }}
                                >
                                    <Ionicons name="medkit" size={24} color={colors.primary} />
                                </View>
                                <Text className="mt-2 text-xs font-bold text-gray-700">{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Shops Section */}
                <View className="px-5 py-4 pb-32">
                    <Text
                        className="text-xl font-bold tracking-tight mb-4"
                        style={{ color: colors.text }}
                    >
                        Available {name}s
                    </Text>
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
                            className="mb-6 rounded-3xl shadow-xl shadow-black/10 border overflow-hidden active:scale-[0.98]"
                            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
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
                                    <Text
                                        className="text-xl font-black tracking-tight"
                                        style={{ color: colors.text }}
                                    >
                                        {shop.name}
                                    </Text>
                                    <Text
                                        className="font-semibold text-sm mt-0.5"
                                        style={{ color: colors.textMuted }}
                                    >
                                        {shop.speclization}
                                    </Text>
                                    </View>
                                    <View
                                        className="px-3 py-1.5 rounded-full"
                                        style={{ backgroundColor: colors.background }}
                                    >
                                        <Text
                                            className="font-bold text-sm"
                                            style={{ color: colors.primary }}
                                        >
                                            ₹{shop.price}/m
                                        </Text>
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
                <View
                    className="flex-row items-center shadow-2xl shadow-black/30 border flex-1 rounded-full px-5 py-4 mr-3"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                    <Ionicons name="search" size={20} color={colors.textMuted} />
                    <TextInput
                        placeholder="Search for a specialist..."
                        className="ml-3 flex-1 font-semibold"
                        placeholderTextColor={colors.textMuted}
                        selectionColor={colors.primary}
                        style={{ color: colors.text }}
                    />
                </View>
                <TouchableOpacity className="bg-[#1a1a1a] shadow-2xl shadow-black/40 p-4 rounded-full flex-center size-14">
                    <MaterialIcons name="menu-book" size={24} color="white" />
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}
