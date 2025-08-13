// MyFormScreen.tsx
import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    Alert,
    ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

export default function MyFormScreen() {
    const [address, setAddress] = useState("");
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [mobile, setMobile] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const GOOGLE_API_KEY = "AIzaSyA97WCu7Ld0sSnNWbgAfEouBfRqXSB8dnw"; // <-- Must have Places API + Geocoding API enabled

    // Detect location and reverse geocode
    const detectLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission denied", "Location permission is required.");
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setCoords({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        });

        try {
            const resp = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_API_KEY}`
            );
            const data = await resp.json();
            if (data.status === "OK") {
                setAddress(data.results[0]?.formatted_address || "");
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
        setAddress(text);
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

    // Pick image
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    // Submit
    const handleSubmit = async () => {
        if (!coords || !mobile || !image) {
            Alert.alert("Missing fields", "Please complete all fields.");
            return;
        }

        const payload = {
            address,
            latitude: coords.latitude,
            longitude: coords.longitude,
            mobile,
            image,
        };

        try {
            const res = await fetch("https://your-backend.com/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            Alert.alert("Success", "Form submitted!");
        } catch (err) {
            Alert.alert("Error", "Failed to submit form");
        }
    };

    return (
        <ScrollView className="flex-1 bg-white p-5">
            <Text className="text-lg font-bold mb-3">Fill Your Details</Text>

            {/* Address + Location Button */}
            <View className="flex-row items-center mb-1">
                <TextInput
                    value={address}
                    onChangeText={fetchSuggestions}
                    placeholder="Address"
                    className="flex-1 border border-gray-300 rounded-lg p-3"
                />
                <TouchableOpacity
                    onPress={detectLocation}
                    className="ml-2 bg-blue-500 p-3 rounded-lg"
                >
                    <Text className="text-white">📍</Text>
                </TouchableOpacity>
            </View>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
                <View className="bg-white border border-gray-300 rounded-lg mb-3">
                    {suggestions.map((s, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => {
                                setAddress(s);
                                setSuggestions([]);
                            }}
                            className="p-3 border-b border-gray-200"
                        >
                            <Text>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Mobile Number */}
            <TextInput
                value={mobile}
                onChangeText={setMobile}
                placeholder="Mobile Number"
                keyboardType="phone-pad"
                className="border border-gray-300 rounded-lg p-3 mb-3"
            />

            {/* Image Picker */}
            <TouchableOpacity
                onPress={pickImage}
                className="bg-gray-200 p-4 rounded-lg items-center mb-3"
            >
                {image ? (
                    <Image source={{ uri: image }} className="w-32 h-32 rounded-lg" />
                ) : (
                    <Text>Select Image</Text>
                )}
            </TouchableOpacity>

            {/* Coordinates */}
            {coords && (
                <Text className="text-sm mb-3">
                    Lat: {coords.latitude} | Lng: {coords.longitude}
                </Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
                onPress={handleSubmit}
                className="bg-green-500 p-4 rounded-lg"
            >
                <Text className="text-white text-center font-bold">Submit</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
