import React from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    Image,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";

export default function App() {
    return (
        <SafeAreaView className="flex-1 bg-purple-900">
            <View className="flex-1 bg-purple-900">
                <ScrollView
                    stickyHeaderIndices={[1]}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    className="bg-purple-900" // 👈 purple overscroll background
                >
                    {/* Wrap all content in white background */}
                    <View className="bg-white" style={{ flexGrow: 1, minHeight: "100%" }}>
                        {/* 0) HEADER (scrolls away) */}
                        <View className="bg-purple-900 px-4 pb-4">
                            {/* Top Row */}
                            <View className="flex-row justify-between items-center mt-2">
                                <View>
                                    <Text className="text-white font-semibold text-lg">
                                        Home As
                                    </Text>
                                    <Text className="text-gray-300 text-xs">
                                        flat no -1204 block-a, crossing republic g...
                                    </Text>
                                </View>
                                <TouchableOpacity className="bg-purple-700 px-3 py-1 rounded-full">
                                    <Text className="text-white">Profile</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Categories */}
                            <View className="mt-5">
                                <Text className="text-2xl text-white">MinutesMan</Text>
                            </View>
                        </View>

                        {/* 1) STICKY SEARCH BAR */}
                        <View className="bg-purple-900 px-4 pb-2">
                            <View
                                className="bg-white p-3 rounded-lg"
                                style={{
                                    elevation: 4,
                                    shadowOpacity: 0.2,
                                    shadowRadius: 4,
                                    shadowOffset: { width: 0, height: 2 },
                                }}
                            >
                                <TextInput
                                    placeholder="Search for 'Pizza'"
                                    className="text-black"
                                />
                            </View>
                        </View>

                        {/* 2) CONTENT */}

                        {/* Offer Banner */}
                        <View className="bg-purple-900 mt-3 mx-3 rounded-xl p-4 flex-row items-center justify-between">
                            <View>
                                <Text className="text-white font-semibold">
                                    Enjoy extra 10% OFF, exclusively for you!
                                </Text>
                                <TouchableOpacity className="mt-2 bg-white px-3 py-1 rounded-lg">
                                    <Text className="text-purple-900 font-bold">Order Now</Text>
                                </TouchableOpacity>
                            </View>
                            <Image
                                source={{ uri: "https://via.placeholder.com/80" }}
                                className="w-20 h-20 rounded-lg"
                            />
                        </View>

                        {/* High Protein Section */}
                        <View className="mt-4">
                            <Text className="text-lg font-bold px-3">High Protein</Text>
                            <Text className="px-3 text-gray-500 text-sm">
                                Curated dishes with more than 30gm protein
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="mt-3 px-3"
                            >
                                {[
                                    { name: "Paneer Tikka", img: "https://via.placeholder.com/120" },
                                    { name: "Chicken Grill", img: "https://via.placeholder.com/120" },
                                    { name: "Tofu Salad", img: "https://via.placeholder.com/120" },
                                ].map((item, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        className="bg-white rounded-xl mr-3 shadow w-40 p-3"
                                    >
                                        <Image
                                            source={{ uri: item.img }}
                                            className="w-full h-24 rounded-lg"
                                        />
                                        <Text className="mt-2 font-semibold">{item.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Store Section */}
                        <View className="mt-6 px-3">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-lg font-bold">99 Store</Text>
                                <Text className="text-blue-600">See All</Text>
                            </View>
                            <Text className="text-gray-500 text-sm">
                                Free delivery with ecosaver mode
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="mt-3"
                            >
                                {[
                                    { name: "Samosa 2", img: "https://via.placeholder.com/100" },
                                    { name: "Bombay Drink", img: "https://via.placeholder.com/100" },
                                    { name: "Aloo Pyaz", img: "https://via.placeholder.com/100" },
                                ].map((item, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        className="bg-white rounded-xl mr-3 p-2 shadow"
                                    >
                                        <Image
                                            source={{ uri: item.img }}
                                            className="w-24 h-24 rounded-lg"
                                        />
                                        <Text className="text-center mt-1">{item.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}