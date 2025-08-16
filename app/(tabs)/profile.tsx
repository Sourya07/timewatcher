import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    Pressable,
    Image,
    ActivityIndicator,
    Animated,
    StyleSheet,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import axios from "axios";
import type { ReactNode } from "react";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = SCREEN_HEIGHT / 4;
const HEADER_MIN_HEIGHT = 120;

function Chip() {
    return (
        <View className="flex-row items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center">
                <View className="h-10 w-10 rounded-full bg-purple-100 items-center justify-center mr-3" />
                <View>
                    <View className="flex-row items-center">
                        <Text className="text-base font-semibold">Minutesmen</Text>

                        <View className="ml-2 rounded-full bg-green-100 px-2 py-0.5">
                            <Text className="text-[10px] font-semibold text-green-700">ACTIVE</Text>
                        </View>
                    </View>
                    <Text className="text-[13px] text-gray-600 mt-1">Minutesman</Text>
                    <Text className="text-[12px] text-gray-500">
                        Explore your exclusive One Minutes benefits
                    </Text>
                </View>
            </View>
            <Feather name="chevron-down" size={22} />
        </View>
    );
}

type QuickActionProps = {
    icon: ReactNode;
    label: string;
    onPress?: () => void;
};

function QuickAction({ icon, label, onPress }: QuickActionProps) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-1 bg-white rounded-2xl items-center justify-center p-4 mr-3 shadow-sm"
        >
            <View className="h-10 w-10 rounded-xl bg-gray-100 items-center justify-center mb-2">
                {icon}
            </View>
            <Text className="text-[12px] text-gray-700 text-center">{label}</Text>
        </Pressable>
    );
}

type ListItemProps = {
    icon: ReactNode;
    label: string;
};

function ListItem({ icon, label }: ListItemProps) {
    return (
        <Pressable className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
                <View className="h-9 w-9 rounded-xl bg-gray-100 items-center justify-center mr-3">
                    {icon}
                </View>
                <Text className="text-[15px] text-gray-800">{label}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </Pressable>
    );
}

interface UserData {
    id: number;
    name: string;
    email: string;
    mobilenumber: string;
    profile?: {
        address?: string;
        mobilenumber?: string;
        image?: string;
    };
}

export default function ProfileScreen() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<UserData>();
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = await SecureStore.getItemAsync("usertoken");
                if (!token) {
                    router.replace("/(authuser)/sign-in");
                    return;
                }
                const res = await axios.get<UserData>(
                    "https://timewatcher.onrender.com/api/v1/user/",
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setUserData(res.data);
            } catch (err) {
                console.log("Error fetching user:", err);
                router.replace("/(authuser)/sign-in");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#000" />
            </SafeAreaView>
        );
    }

    if (!userData) return null;

    // Stretchy Header height interpolation
    const headerHeight = scrollY.interpolate({
        inputRange: [-150, 0, HEADER_MAX_HEIGHT],
        outputRange: [HEADER_MAX_HEIGHT + 150, HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        extrapolate: "clamp",
    });

    // Fade effect for profile content inside header
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_MAX_HEIGHT / 2, HEADER_MAX_HEIGHT],
        outputRange: [1, 0.8, 0.6],
        extrapolate: "clamp",
    });

    const handleScroll = Animated.event<
        NativeSyntheticEvent<NativeScrollEvent>
    >([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
    });

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Animated.ScrollView
                scrollEventThrottle={16}
                onScroll={handleScroll}
                contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT }}
            >
                <View className="px-4">
                    <Chip />

                    <View className="flex-row mt-4">
                        <QuickAction
                            icon={<Ionicons name="location-outline" size={18} />}
                            label="Saved Address"
                            onPress={() =>
                                router.push({
                                    pathname: "../userflow/savedaddress",
                                    params: { address: userData.profile?.address || "" },
                                })
                            }
                        />
                        <QuickAction
                            icon={<Ionicons name="card-outline" size={19} />}
                            label="Payment Mode"
                        />
                        <QuickAction
                            icon={<MaterialIcons name="chat-bubble-outline" size={18} />}
                            label="My Refund"
                        />
                        <QuickAction
                            icon={<Ionicons name="wallet-outline" size={18} />}
                            label="Minutes Money"
                        />
                    </View>

                    <View className="bg-white rounded-2xl mt-6 p-4 shadow-sm">
                        <ListItem icon={<MaterialIcons name="credit-card" size={18} />} label="Yourcard" />
                        <View className="h-px bg-gray-100" />
                        <ListItem icon={<Feather name="gift" size={18} />} label="My Vouchers" />
                        <View className="h-px bg-gray-100" />
                        <ListItem icon={<Feather name="file-text" size={18} />} label="Account Statement" />
                        <View className="h-px bg-gray-100" />
                        <ListItem icon={<Feather name="briefcase" size={18} />} label="Corporate Rewards" />
                        <View className="h-px bg-gray-100" />
                        <ListItem icon={<Feather name="book-open" size={18} />} label="Student Rewards" />
                        <View className="h-px bg-gray-100" />
                        <ListItem icon={<Feather name="bookmark" size={18} />} label="My Shop" />
                        <View className="h-px bg-gray-100" />
                        <ListItem icon={<Feather name="heart" size={18} />} label="Favourites" />
                        <View className="h-px bg-gray-100" />
                        <ListItem icon={<Feather name="award" size={18} />} label="Partner Rewards" />
                    </View>
                </View>
                <View className="h-10" />
            </Animated.ScrollView>

            {/* Animated Header */}
            <Animated.View style={[styles.header, { height: headerHeight }]}>
                <LinearGradient
                    colors={["#ff7e5f", "#feb47b"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
                    <View className="px-5 pt-2 w-full">
                        <View className="flex-row items-center justify-between">
                            <Pressable
                                onPress={() => router.back()}
                                className="h-10 w-10 rounded-full bg-white/10 items-center justify-center"
                            >
                                <Ionicons name="chevron-back" size={22} color="white" />
                            </Pressable>
                            <View className="flex-row items-center">
                                <Pressable className="rounded-full bg-white/10 px-3 py-2 mr-2">
                                    <Text className="text-white text-[12px] font-medium">Help</Text>
                                </Pressable>
                                <Pressable className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
                                    <Feather name="more-vertical" size={20} color="white" />
                                </Pressable>
                            </View>
                        </View>

                        <View className="mt-5">
                            <Text className="text-white text-2xl font-extrabold">{userData.name}</Text>
                            <Text className="text-white/80 mt-1">{userData.email}</Text>
                            <Text className="text-white/80">{userData.mobilenumber}</Text>
                        </View>

                        <View className="absolute right-5 bottom-[-20]">
                            <Image
                                source={{ uri: userData.profile?.image || "https://via.placeholder.com/150" }}
                                className="h-20 w-20 rounded-full border-2 border-dashed border-white/70"
                            />
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        overflow: "hidden",
        zIndex: 1000,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flex: 1,
        justifyContent: "flex-end",
        paddingBottom: 24,
    },
});