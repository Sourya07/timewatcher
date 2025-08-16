import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function SavedAddress() {
    const { address } = useLocalSearchParams();

    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-4">
            <Text className="text-lg font-bold mb-4">Saved Address</Text>
            <View className="bg-white p-4 rounded-xl shadow-sm">
                <Text className="text-gray-600">🏠 {address || "No address found"}</Text>
            </View>
        </SafeAreaView>
    );
}