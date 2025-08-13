import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Alert,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    FlatList
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '@/components/Custominput';
import CustomButton from '@/components/Custombutton';
import * as SecureStore from 'expo-secure-store';
import WheelPickerExpo from "react-native-wheel-picker-expo";
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const GOOGLE_API_KEY = "AIzaSyA97WCu7Ld0sSnNWbgAfEouBfRqXSB8dnw";

import { LogBox } from 'react-native';
LogBox.ignoreLogs([
    'VirtualizedLists should never be nested',
]);

export default function AdminShopForm({ adminId }: { adminId: number }) {
    const [form, setForm] = useState({
        image: '',
        latitude: null as number | null,
        longitude: null as number | null,
        address: '',
        mobilenumber: '',
        occupation: '',
        speclization: '',
        timeinHour: '',
        timeinPeriod: 'AM',
        timeoutHour: '',
        timeoutPeriod: 'PM',
        price: '',
    });

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const handleChange = (name: string, value: string) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    /** Detect Current Location */
    const detectLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission denied", "Location permission is required.");
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setForm((prev) => ({
            ...prev,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        }));

        try {
            const resp = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_API_KEY}`
            );
            const data = await resp.json();
            if (data.status === "OK") {
                handleChange("address", data.results[0]?.formatted_address || "");
                setSuggestions([]);
            } else {
                Alert.alert("Error", "Failed to get address");
            }
        } catch (err) {
            Alert.alert("Error", "Failed to fetch address");
        }
    };

    /** Fetch Suggestions from Google Places API */
    const fetchSuggestions = async (text: string) => {
        handleChange("address", text);
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

    const convertTo24Hour = (hour: string, period: 'AM' | 'PM') => {
        let h = parseInt(hour);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h;
    };

    const validateTimings = () => {
        const inHour24 = convertTo24Hour(form.timeinHour, form.timeinPeriod as 'AM' | 'PM');
        const outHour24 = convertTo24Hour(form.timeoutHour, form.timeoutPeriod as 'AM' | 'PM');

        if (isNaN(inHour24) || isNaN(outHour24)) {
            Alert.alert('Error', 'Please enter valid hours for Time In and Time Out');
            return false;
        }
        if (outHour24 <= inHour24) {
            Alert.alert('Error', 'Time Out must be after Time In');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        try {
            if (!validateTimings()) return;
            setIsSubmitting(true);

            const token = await SecureStore.getItemAsync('token');
            if (!token) throw new Error('User not authenticated');

            const payload = {
                ...form,
                timein: `${form.timeinHour} ${form.timeinPeriod}`,
                timeout: `${form.timeoutHour} ${form.timeoutPeriod}`,
                price: Number(form.price),
                AdminId: adminId,
            };

            const res = await fetch('https://timewatcher.onrender.com/api/v1/admin/adminshop', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Submission failed');

            Alert.alert('Success', 'Shop created successfully!');
            router.replace('/adminfolder');
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (

        <SafeAreaView className="flex-1 bg-white">
            <TouchableOpacity
                onPress={() => router.back()}
                className="absolute top-14 left-4 z-10 bg-gray-50 p-2 rounded-full"
                style={{ elevation: 2 }}
            >
                <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <KeyboardAwareScrollView
                nestedScrollEnabled
                contentContainerStyle={{ paddingBottom: 100 }}
                className="flex-1 bg-white px-5"
            >
                <View className="gap-8 bg-white rounded p-2 mt-12">
                    <Text className="text-xl font-bold text-gray-800">Create Admin Shop</Text>

                    {/* Image URL */}
                    <CustomInput
                        label="Image URL"
                        placeholder="Enter image URL"
                        value={form.image}
                        onChangeText={(text) => handleChange('image', text)}
                    />

                    {/* Address + Location */}
                    <View className="relative">
                        <CustomInput
                            label="Address"
                            placeholder="Search or detect location"
                            value={form.address}
                            onChangeText={fetchSuggestions}
                        />
                        <TouchableOpacity
                            style={{ position: 'absolute', right: 10, top: 38 }}
                            onPress={detectLocation}
                        >
                            <Ionicons name="locate" size={22} color="gray" />
                        </TouchableOpacity>
                    </View>

                    {/* Suggestions List */}
                    {/* Suggestions List */}
                    {suggestions.length > 0 && (
                        <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" }}>
                            {suggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={async () => {
                                        try {
                                            // 1. Update address
                                            handleChange("address", item);
                                            setSuggestions([]);

                                            // 2. Geocode address -> lat/long
                                            const resp = await fetch(
                                                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                                                    item
                                                )}&key=${GOOGLE_API_KEY}`
                                            );
                                            const data = await resp.json();

                                            if (data.status === "OK" && data.results.length > 0) {
                                                const location = data.results[0].geometry.location;
                                                setForm((prev) => ({
                                                    ...prev,
                                                    latitude: location.lat,
                                                    longitude: location.lng,
                                                }));
                                            } else {
                                                Alert.alert("Error", "Could not get coordinates for this address");
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            Alert.alert("Error", "Failed to fetch coordinates");
                                        }
                                    }}
                                    style={{ padding: 8, borderBottomWidth: 1, borderColor: "#eee" }}
                                >
                                    <Text>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Rest of your form stays the same... */}
                    <CustomInput
                        label="Mobile Number"
                        placeholder="Enter mobile number"
                        value={form.mobilenumber}
                        onChangeText={(text) => handleChange('mobilenumber', text)}
                        keyboardType="phone-pad"
                    />

                    <CustomInput
                        label="Occupation"
                        placeholder="Enter occupation"
                        value={form.occupation}
                        onChangeText={(text) => handleChange('occupation', text)}
                    />

                    <CustomInput
                        label="Specialization"
                        placeholder="Enter specialization"
                        value={form.speclization}
                        onChangeText={(text) => handleChange('speclization', text)}
                    />

                    {/* Time In */}
                    <View>
                        <Text className="text-gray-700 mb-1">Time In</Text>
                        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                                <CustomInput
                                    label="Hour"
                                    placeholder="Hour (1-12)"
                                    value={form.timeinHour}
                                    onChangeText={(text) => handleChange('timeinHour', text)}
                                />
                            </View>
                            <View style={{
                                flex: 1,
                                borderWidth: 1,
                                borderColor: '#d1d5db',
                                borderRadius: 8,
                                overflow: 'hidden',
                                height: 60,
                                justifyContent: 'center'
                            }}>
                                <WheelPickerExpo

                                    height={100}
                                    initialSelectedIndex={form.timeinPeriod === 'AM' ? 0 : 1}
                                    items={[
                                        { label: 'AM', value: 'AM' },
                                        { label: 'PM', value: 'PM' }
                                    ]}
                                    onChange={({ item }) => handleChange('timeinPeriod', item.value)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Time Out */}
                    <View style={{ marginTop: 20 }}>
                        <Text className="text-gray-700 mb-1">Time Out</Text>
                        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                                <CustomInput
                                    label="Hour"
                                    placeholder="Hour (1-12)"
                                    value={form.timeoutHour}
                                    onChangeText={(text) => handleChange('timeoutHour', text)}
                                />
                            </View>
                            <View style={{
                                flex: 1,
                                borderWidth: 1,
                                borderColor: '#d1d5db',
                                borderRadius: 8,
                                overflow: 'hidden',
                                height: 60,
                                justifyContent: 'center'
                            }}>
                                <WheelPickerExpo
                                    height={100}
                                    initialSelectedIndex={form.timeoutPeriod === 'AM' ? 0 : 1}
                                    items={[
                                        { label: 'AM', value: 'AM' },
                                        { label: 'PM', value: 'PM' }
                                    ]}
                                    onChange={({ item }) => handleChange('timeoutPeriod', item.value)}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Price */}
                    <CustomInput
                        label="Price"
                        placeholder="Enter price"
                        value={form.price}
                        onChangeText={(text) => handleChange('price', text)}
                        keyboardType="numeric"
                    />

                    <CustomButton
                        title={isSubmitting ? 'Submitting...' : 'Submit'}
                        onPress={handleSubmit}
                        isLoading={isSubmitting}
                    />

                    {errorMsg && <Text className="text-red-500 mt-2">{errorMsg}</Text>}
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView >

    );
}