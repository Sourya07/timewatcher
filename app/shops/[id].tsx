import { View, Text, Image, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useMemo } from 'react';
import MultiSlider from "@ptomasroos/react-native-multi-slider";

interface ShopDetailsParams {
    name?: string;
    image?: any;
    address?: string;
    mobilenumber?: string;
    occupation?: string;
    timein?: string;  // "09:00"
    timeout?: string; // "10:00"
    price?: string;
}

function timeToMinutes(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(minutes: number) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function ShopDetails() {
    const { name, image, address, mobilenumber, occupation, timein, timeout, price } =
        useLocalSearchParams() as ShopDetailsParams;

    const startMinutes = timein ? timeToMinutes(timein) : 540; // default 09:00
    const endMinutes = timeout ? timeToMinutes(timeout) : 600; // default 10:00

    const [range, setRange] = useState([startMinutes, endMinutes]);

    const timeMarks = useMemo(() => {
        const marks: string[] = [];
        for (let t = startMinutes; t <= endMinutes; t += 60) {
            marks.push(minutesToTime(t));
        }
        return marks;
    }, [startMinutes, endMinutes]);

    return (
        <SafeAreaView className="bg-[#f0f0f0] flex-1">
            <ScrollView className="px-4">
                2
                {/* Top Image */}
                <View className="items-center mt-6">
                    <Image
                        source={{ uri: image || 'https://via.placeholder.com/200' }}
                        className="w-40 h-40 rounded-xl border-2 border-white"
                    />
                </View>

                {/* Name & Occupation */}
                <View className="items-center mt-4">
                    <Text className="text-black text-lg font-bold">{name || occupation}</Text>
                    <Text className="text-gray-500 text-sm mt-1">{occupation}</Text>
                </View>

                {/* Contact Details */}
                <View className="mt-8 space-y-4">
                    <View className="bg-white p-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm">📍 Address</Text>
                        <Text className="text-black mt-1">{address || "Not available"}</Text>
                    </View>

                    <View className="bg-white mt-2 p-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm">📞 Mobile</Text>
                        <Text className="text-black mt-1">{mobilenumber || "Not available"}</Text>
                    </View>
                </View>

                {/* Shop Timings */}
                <View className="mt-5 space-y-4">
                    <View className="bg-white p-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm">⏱ Timings</Text>
                        <Text className="text-black mt-1">{timein} - {timeout}</Text>
                    </View>

                    {/* Slider */}
                    <View className="bg-white p-4 mt-4 rounded-xl shadow-sm">
                        <Text className="text-gray-500 text-sm mb-2">
                            Select Time for your slot: {minutesToTime(range[0])} - {minutesToTime(range[1])}
                        </Text>
                        <MultiSlider
                            values={range}
                            sliderLength={300}
                            onValuesChange={(values) => setRange(values)}
                            min={startMinutes}
                            max={endMinutes}
                            step={5}
                            selectedStyle={{ backgroundColor: "#00BFFF" }}
                            unselectedStyle={{ backgroundColor: "#808080" }}
                            markerStyle={{ backgroundColor: "#00BFFF" }}
                        />
                        {/* Time Labels */}
                        <View className="flex-row justify-between mt-2">
                            {timeMarks.map((t, i) => (
                                <Text key={i} className="text-gray-500 text-xs">{t}</Text>
                            ))}
                        </View>
                    </View>
                </View>

                <View className="bg-white mt-2 p-4 rounded-xl shadow-sm">
                    <Text className="text-gray-500 text-sm">Sloted booked</Text>
                    <Text className="text-black mt-1">  </Text>
                </View>

                {/* Price */}
                <View className="mt-5 bg-white p-4 rounded-xl shadow-sm items-center">
                    <Text className="text-gray-500 text-sm">💰 Price</Text>
                    <Text className="text-black mt-1 font-bold">₹{price || "N/A"}</Text>
                </View>

                {/* Extra Description */}
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