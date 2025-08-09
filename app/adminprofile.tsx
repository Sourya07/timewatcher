import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Alert,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '@/components/Custominput';
import CustomButton from '@/components/Custombutton';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router'

export default function AdminShopForm({ adminId }: { adminId: number }) {
    const [form, setForm] = useState({
        image: '',
        latitude: null as number | null,
        longitude: null as number | null,
        address: '',
        mobilenumber: '',
        occupation: '',
        speclization: '',
        timein: '',
        timeout: '',
        price: '',
    });

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            const loc = await Location.getCurrentPositionAsync({});
            const [addr] = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            });

            setForm((prev) => ({
                ...prev,
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                address: `${addr.name}, ${addr.street}, ${addr.city}, ${addr.region}, ${addr.country}`,
            }));
        } catch (err: any) {
            Alert.alert('Location Error', err.message);
        }
    };

    useEffect(() => {
        getLocation();
    }, []);

    const handleChange = (name: string, value: string) => {
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const token = await SecureStore.getItemAsync('token');
            if (!token) throw new Error('User not authenticated');
            const payload = {
                ...form,
                timein: form.timein,
                timeout: form.timeout,
                price: Number(form.price),
                AdminId: adminId,
            };

            const res = await fetch('http://localhost:3000/api/v1/admin/adminshop', {
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
            <ScrollView className="flex-1 bg-white px-5"
                contentContainerStyle={{ paddingBottom: 100 }}
            >

                <View className="gap-8 bg-white rounded p-2 mt-12 ">
                    <Text className="text-xl font-bold text-gray-800">Create Admin Shop</Text>

                    <CustomInput
                        label="Image URL"
                        placeholder="Enter image URL"
                        value={form.image}
                        onChangeText={(text) => handleChange('image', text)}
                    />

                    <View className="relative">
                        <CustomInput
                            label="Address"
                            placeholder="Auto-filled from GPS"
                            value={form.address}

                        />
                        <Ionicons
                            name="location-sharp"
                            size={20}
                            color="gray"
                            style={{ position: 'absolute', right: 10, top: 38 }}
                        />
                    </View>

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

                    <CustomInput
                        label="Time In"
                        placeholder="e.g., 9"
                        value={form.timein}
                        onChangeText={(text) => handleChange('timein', text)}
                        keyboardType="numeric"
                    />

                    <CustomInput
                        label="Time Out"
                        placeholder="e.g., 18"
                        value={form.timeout}
                        onChangeText={(text) => handleChange('timeout', text)}
                        keyboardType="numeric"
                    />

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
            </ScrollView>
        </SafeAreaView>
    );
}