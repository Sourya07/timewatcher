import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { Redirect, Slot, router } from "expo-router";
import { images } from "@/constants";
import { Ionicons } from '@expo/vector-icons'; // for the back icon

export default function AuthLayout() {
    const isAuthenticated = false;

    if (isAuthenticated) return <Redirect href="/" />;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView className="bg-white h-full" keyboardShouldPersistTaps="handled">

                {/* Back Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-14 left-4 z-20 bg-gray-50 p-2 rounded-full"
                    style={{ elevation: 4 }}
                >
                    <Ionicons name="arrow-back" size={20} color="light" />
                </TouchableOpacity>

                <View className="w-full relative" style={{ height: Dimensions.get('screen').height / 2.25 }}>
                    <Image
                        source={images.logo}
                        className="self-center size-48 absolute -bottom-16 z-10"
                    />
                </View>

                <Slot />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}