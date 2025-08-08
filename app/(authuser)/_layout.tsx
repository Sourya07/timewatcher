import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image, Pressable } from 'react-native';
import { Slot, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { images } from "@/constants";

export default function AuthLayout() {

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/"); // fallback route
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView className="bg-white h-full" keyboardShouldPersistTaps="handled">
                {/* Back Button */}
                <Pressable
                    onPress={handleBack}
                    style={{
                        position: 'absolute',
                        top: 50,
                        left: 20,
                        zIndex: 20,
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        borderRadius: 50,
                        padding: 8,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 2
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </Pressable>

                <View
                    className="w-full relative"
                    style={{ height: Dimensions.get('screen').height / 2.25 }}
                >
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