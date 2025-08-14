import React, { useState } from "react";
import {
    View,
    Text,
    ImageBackground,
    Pressable,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
    Alert,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { images } from "@/constants";
import { router } from "expo-router";

export default function LocationScreen() {
    const [location, setLocation] = useState("");
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    console.log(suggestions)
    const GOOGLE_API_KEY = "AIzaSyA97WCu7Ld0sSnNWbgAfEouBfRqXSB8dnw"; // Must have Places + Geocoding API

    // Detect current location
    const detectLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission denied", "Location permission is required.");
            return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
        });

        console.log(coords)
        try {
            const resp = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.coords.latitude},${loc.coords.longitude}&key=${GOOGLE_API_KEY}`
            );
            const data = await resp.json();
            if (data.status === "OK") {
                setLocation(data.results[0]?.formatted_address || "");
                setSuggestions([]);
            } else {
                Alert.alert("Error", "Failed to get address");
            }
        } catch (err) {
            Alert.alert("Error", "Failed to fetch address");
        }
    };

    // Fetch suggestions from Google Places Autocomplete API
    const fetchSuggestions = async (text: string) => {
        setLocation(text);
        if (text.length < 4) {
            setSuggestions([]);
            return;
        }
        try {
            const resp = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
                    text
                )}&key=${GOOGLE_API_KEY}`
            );
            const data = await resp.json();
            if (data.status === "OK") {
                setSuggestions(data.predictions.map((p: any) => p.description));
            } else {
                setSuggestions([]);
            }
        } catch (err) {
            console.error(err);
            setSuggestions([]);
        }
    };

    const handleSubmit = () => {
        if (!coords || !location) {
            Alert.alert("Missing fields", "Please enter or detect your location.");
            return;
        }

        const payload = {
            address: location,
            latitude: coords.latitude,
            longitude: coords.longitude,
        };

        console.log("Payload:", payload);
        Alert.alert("Success", "Location submitted!");
        router.push('../(tabs)/profile')
    };

    const handleSuggestionPress = async (address: string) => {
        setLocation(address);
        setSuggestions([]);

        try {
            const resp = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
            );
            const data = await resp.json();
            if (data.status === "OK") {
                const loc = data.results[0].geometry.location;
                setCoords({ latitude: loc.lat, longitude: loc.lng });
            } else {
                Alert.alert("Error", "Failed to get coordinates for selected address");
            }
        } catch (err) {
            Alert.alert("Error", "Failed to fetch coordinates");
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View className="flex-1">
                <ImageBackground
                    source={images.locationbg}
                    className="absolute top-0 left-0 right-0 bottom-0"
                    resizeMode="cover"
                />

                <SafeAreaView className="flex-1 px-6 justify-between">
                    {/* Scrollable content */}
                    <ScrollView className="flex-1 mt-12">
                        <Text className="text-black text-3xl font-bold">
                            What's your location?
                        </Text>
                        <Text className="text-black/60 text-base mt-2">
                            We need your location to show your nearby services
                        </Text>

                        {/* Location Input */}
                        <TextInput
                            value={location}
                            onChangeText={fetchSuggestions}
                            placeholder="Enter your location"
                            placeholderTextColor="rgba(0,0,0,0.4)"
                            className="mt-5 bg-white rounded-xl px-4 py-3 text-base text-black shadow-md"
                        />

                        {/* Suggestions dropdown */}
                        {suggestions.length > 0 && (
                            <View className="bg-white border border-gray-300 rounded-lg mt-2">
                                {suggestions.map((s, i) => (
                                    <Pressable
                                        key={i}
                                        onPress={() => handleSuggestionPress(s)}

                                        className="p-3 border-b border-gray-200"
                                    >
                                        <Text>{s}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Bottom buttons */}
                    <View className="pb-7 gap-4">
                        <Pressable
                            onPress={detectLocation}
                            className="bg-black rounded-xl py-4 items-center"
                        >
                            <Text className="text-white text-lg font-semibold">
                                Use Current Location
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={handleSubmit}
                            className="bg-transparent border border-black rounded-xl py-4 items-center"
                        >
                            <Text className="text-black text-lg font-semibold">Submit</Text>
                        </Pressable>

                        {/* Coordinates info */}
                        {coords && (
                            <Text className="text-black text-sm mt-2">
                                Lat: {coords.latitude} | Lng: {coords.longitude}
                            </Text>
                        )}
                    </View>
                </SafeAreaView>
            </View>
        </TouchableWithoutFeedback>
    );
}