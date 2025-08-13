import { View, Text, Image, ScrollView, SafeAreaView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useShopStore } from '@/Store/shopstore';
import { useState, useMemo, useEffect, } from 'react';
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useRouter } from 'expo-router';
import axios from "axios";
import * as SecureStore from 'expo-secure-store';

const GOOGLE_MAPS_APIKEY = "AIzaSyA97WCu7Ld0sSnNWbgAfEouBfRqXSB8dnw"

export default function ShopDetails() {

    const router = useRouter(); // ✅ hook for navigation
    const userLocation = { latitude: 27.1027378242211, longitude: 83.2817002769377 };

    const { id } = useLocalSearchParams<{ id: string }>(); // param is "id" not index
    const getShopById = useShopStore((state) => state.getShopById);
    console.log(id)
    const shop = getShopById(id);

    if (!shop) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center">
                <Text>No shop found</Text>
            </SafeAreaView>
        );
    }

    // Convert "hh:mm AM/PM" to minutes
    const time12hToMinutes = (time?: string) => {
        if (!time) return 0;
        const [timePart, modifier] = time.trim().split(" ");
        let [hours, minutes] = timePart.split(":").map(Number);
        if (modifier?.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (modifier?.toUpperCase() === "AM" && hours === 12) hours = 0;
        return hours * 60 + minutes;
    };

    const minutesToTime12h = (minutes: number) => {
        let hours = Math.floor(minutes / 60);
        let mins = minutes % 60;
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${mins.toString().padStart(2, "0")} ${ampm}`;
    };

    const startMinutes = time12hToMinutes(String(shop.timein));
    const endMinutes = time12hToMinutes(String(shop.timeout));

    const [range, setRange] = useState([startMinutes, endMinutes]);
    const [selectedTimeRange, setSelectedTimeRange] = useState(
        `${minutesToTime12h(startMinutes)} - ${minutesToTime12h(endMinutes)}`
    );
    const [timeDifference, setTimeDifference] = useState(0);
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    useEffect(() => {
        if (selectedTimeRange) {
            const [start, end] = selectedTimeRange.split(" - ").map(time => time.trim());
            setStartTime(start);
            setEndTime(end);
        }
    }, [selectedTimeRange]);

    console.log(startTime); // "3:47 PM"
    console.log(endTime);

    // Debounce effect
    useEffect(() => {
        if (debounceTimer) clearTimeout(debounceTimer);

        const timer = setTimeout(() => {
            const [start, end] = range;
            let diffMinutes = end - start;
            if (diffMinutes < 0) diffMinutes += 24 * 60;
            setTimeDifference(diffMinutes);


        }, 1000); // 2 second delay

        console.log(selectedTimeRange)
        setDebounceTimer(timer);

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [range]);


    const a = (shop.price) * (timeDifference)

    const handleBooking = async () => {
        try {

            const usertoken = await SecureStore.getItemAsync('usertoken'); // or however you stored it
            if (!usertoken) {
                Alert.alert("Error", "Please log in first.");
                return;
            }
            // 1️⃣ Send POST request
            await axios.post("https://timewatcher.onrender.com/api/v1/booking", {
                shopId: Number(id),
                duration: timeDifference,
                price: a,
                startTime,
                endTime


            },
                {
                    headers: {
                        Authorization: `Bearer ${usertoken}`
                    }
                }
            );

            // 2️⃣ Navigate after success
            // router.push({
            //     pathname: "../booking/[booking]",
            //     params: { id, totalPrice: a },
            // });
            Alert.alert("Booking Completed");
        }
        catch (error: any) {
            console.error("Error creating booking:", error);

            // Check if error response exists (from backend)
            if (error.response && error.response.data && error.response.data.message) {
                Alert.alert("Booking Failed", error.response.data.message);
            } else if (error.message) {
                Alert.alert("Booking Failed", error.message);
            } else {
                Alert.alert("Booking Failed", "Please try again.");
            }
        }
    };





    return (
        <SafeAreaView className="bg-[#f0f0f0] flex-1">
            <ScrollView className="px-4">
                <View className="items-center mt-4">
                    <Text className="text-black text-lg font-bold">{shop.name || shop.occupation}</Text>
                    <Text className="text-gray-500 text-sm mt-1">{shop.occupation}</Text>
                </View>

                {/* Location & Route at Top */}
                <View className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">


                    <View className="h-64 mt-2">
                        <MapView
                            className="flex-1"
                            style={{ flex: 1 }}
                            initialRegion={{
                                latitude: (userLocation.latitude + shop.latitude) / 2,
                                longitude: (userLocation.longitude + shop.longitude) / 2,
                                latitudeDelta: Math.abs(userLocation.latitude - shop.latitude) + 0.05,
                                longitudeDelta: Math.abs(userLocation.longitude - shop.longitude) + 0.05,
                            }}
                        >
                            {/* User Marker */}
                            <Marker coordinate={userLocation} title="You" pinColor="blue" />

                            {/* Shop Marker with Image */}
                            <Marker coordinate={{ latitude: shop.latitude, longitude: shop.longitude }} title={shop.name || "Shop"}>
                                <Image
                                    source={{ uri: shop.image || 'https://via.placeholder.com/200' }}
                                    style={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: 10,
                                        borderWidth: 2,
                                        borderColor: "white",
                                    }}
                                />
                            </Marker>

                            {/* Route */}
                            <MapViewDirections
                                origin={userLocation}
                                destination={{ latitude: shop.latitude, longitude: shop.longitude }}
                                apikey={GOOGLE_MAPS_APIKEY}
                                strokeWidth={4}
                                strokeColor="hotpink"
                                onReady={(result) => {
                                    console.log(`Distance: ${result.distance} km`);
                                    console.log(`Duration: ${result.duration} min`);
                                }}
                            />
                        </MapView>
                    </View>
                </View>

                {/* Name & Occupation */}

                {/* Contact Details */}
                <View className="mt-8 space-y-4">
                    <View className="bg-white p-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm">📍 Address</Text>
                        <Text className="text-black mt-1">{shop.address || "Not available"}</Text>
                    </View>

                    <View className="bg-white mt-2 p-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm">📞 Mobile</Text>
                        <Text className="text-black mt-1">{shop.mobilenumber || "Not available"}</Text>
                    </View>
                </View>

                {/* Timings */}
                <View className="mt-5 space-y-4">
                    <View className="bg-white p-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm">⏱ Timings</Text>
                        <Text className="text-black mt-1">{shop.timein} - {shop.timeout}</Text>
                    </View>

                    {/* Slider */}
                    <View className="bg-white p-4 mt-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm mb-2">
                            Select Time: {minutesToTime12h(range[0])} - {minutesToTime12h(range[1])}
                        </Text>
                        <MultiSlider
                            values={range}
                            sliderLength={300}
                            onValuesChange={(values) => {
                                setRange(values);
                                setSelectedTimeRange(
                                    `${minutesToTime12h(values[0])} - ${minutesToTime12h(values[1])}`
                                );
                            }}
                            min={startMinutes}
                            max={endMinutes}
                            step={1}
                            selectedStyle={{ backgroundColor: "#00BFFF" }}
                            unselectedStyle={{ backgroundColor: "#808080" }}
                            markerStyle={{ backgroundColor: "#00BFFF" }}
                        />
                    </View>
                </View>

                {/* Price */}
                <View className="mt-5 bg-white p-4 rounded-xl shadow-sm items-center">
                    <Text className="text-gray-500 text-sm">💰 Price/Min</Text>
                    <Text className="text-black mt-1 font-bold">₹{shop.price || "N/A"}</Text>
                </View>

                {/* BOOK NOW */}
                <Pressable
                    onPress={handleBooking}
                    className="mt-5 bg-blue-500 p-4 rounded-xl shadow-sm items-center active:opacity-70"
                >
                    <Text className="text-white text-sm">BOOK NOW</Text>
                    <Text className="text-black mt-1 font-bold">₹{a || "N/A"}</Text>
                </Pressable>

                {/* About */}
                <View className="mt-6 bg-white p-4 rounded-xl shadow-sm">
                    <Text className="text-gray-500 text-sm">About</Text>
                    <Text className="text-gray-700 mt-1">
                        This is the shop details page. You can add reviews, offers, or a description here.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
