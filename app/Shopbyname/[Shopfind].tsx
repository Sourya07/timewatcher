import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    TextInput,
} from "react-native";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useShopStore, Shop } from "@/Store/shopstore";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "expo-router";
import ShopDetails from "../shops/[id]";

// inside your component
const router = useRouter();


export default function ShopByName() {
    const { name } = useLocalSearchParams<{ name: string }>();
    const { getShopByname, fetchShops, loading } = useShopStore();
    const [foundShops, setFoundShops] = useState<Shop[]>([]);

    useEffect(() => {
        if (!name) return;
        async function fetchAndFind() {
            if (getShopByname(name).length === 0) {
                await fetchShops();
            }
            const shops = getShopByname(name);
            setFoundShops(shops);
        }
        fetchAndFind();
    }, [name]);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Text>Loading shops...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView>
                {/* Header */}
                <View className="px-4 py-3 border-b border-gray-200">
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center mb-1">
                            <TouchableOpacity>
                                <AntDesign name="arrowleft" size={22} color="#111827" onPress={() => {
                                    router.push("/")
                                }} />

                            </TouchableOpacity>
                            <Text className="text-2xl font-semibold ml-2">{name}</Text>
                        </View>
                        <View className="bg-emerald-600 rounded-full px-3 py-1">
                            <Text className="text-white font-medium">4.4 ★</Text>
                        </View>
                    </View>
                    <Text className="text-gray-500 mt-1">3.8 km · Gaur City 1</Text>
                    <Text className="text-gray-500">45–50 mins · Schedule for later</Text>
                </View>

                {/* Offers */}
                <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200">
                    <Text className="text-blue-600 font-medium">Flat ₹75 OFF above ₹199</Text>
                    <Text className="text-gray-500">5 offers ▼</Text>
                </View>

                {/* Filters */}
                <View className="flex-row px-4 py-3 space-x-3">
                    <TouchableOpacity className="px-4 py-2 border rounded-full border-gray-300">
                        <Text>ro</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-4 py-2 border rounded-full border-gray-300">
                        <Text>Section</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-4 py-2 border rounded-full border-gray-300">
                        <Text>Specialist</Text>
                    </TouchableOpacity>
                </View>

                {/* Template Categories */}
                <View className="px-4 py-3">
                    <Text className="text-lg font-semibold mb-3">Categories</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {["Doctors", "Advocate", "courier", "Dermatologist"].map((cat, idx) => (
                            <TouchableOpacity
                                key={idx}
                                className="mr-3 items-center"
                            >
                                <View className="w-20 h-20 rounded-full bg-gray-200 justify-center items-center">
                                    <Ionicons name="medkit" size={28} color="#111827" />
                                </View>
                                <Text className="mt-1 text-sm text-gray-700">{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>



                {/* Shops Section */}
                <View className="px-4 py-3">
                    <Text className="text-lg font-semibold mb-3">Available Doctors</Text>
                    {foundShops.map((shop) => (
                        <TouchableOpacity
                            key={shop.id}
                            onPress={() => router.push(`../shops/${shop.id}`)} // Navigate to details page
                            className="mb-6 bg-white rounded-xl shadow-sm border p-4"
                        >
                            {shop.image ? (
                                <Image
                                    source={{ uri: shop.image }}
                                    className="w-full h-40 rounded-lg mb-3"
                                    resizeMode="cover"
                                />
                            ) : null}
                            <Text className="text-xl font-semibold">{shop.name}</Text>
                            <Text className="text-gray-500">{shop.speclization}</Text>
                            <Text className="mt-1">
                                <Text className="font-semibold">Address: </Text>
                                {shop.address}
                            </Text>
                            <Text>
                                <Text className="font-semibold">Price: </Text>₹{shop.price}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
            {/* Bottom Search + Menu */}
            <View className="absolute left-4 right-4 bottom-5 flex-row items-center justify-between">
                <View className="flex-row items-center bg-gray-100 flex-1 rounded-full px-4 py-3 mr-3">
                    <AntDesign name="search1" size={18} color="#9ca3af" />
                    <TextInput
                        placeholder="Search in shops"
                        className="ml-3 flex-1 text-gray-700"
                        placeholderTextColor="#9ca3af"
                    />
                </View>
                <TouchableOpacity className="bg-black px-4 py-3 rounded-xl">
                    <View className="flex-row items-center">
                        <MaterialIcons name="menu-book" size={18} color="white" />
                        <Text className="text-white ml-2 font-semibold">Menu</Text>
                    </View>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}
