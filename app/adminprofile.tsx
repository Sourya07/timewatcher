import React, { useState } from 'react';
import {
    View, Text, Alert, ScrollView, SafeAreaView,
    TouchableOpacity, StyleSheet, FlatList
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '@/components/Custominput';
import CustomButton from '@/components/Custombutton';
import WheelPickerExpo from "react-native-wheel-picker-expo";
import { createAdminShop } from '@/constants/adminApi';
import { router } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';

const GOOGLE_API_KEY = "AIzaSyA97WCu7Ld0sSnNWbgAfEouBfRqXSB8dnw";

import { LogBox } from 'react-native';
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

export default function AdminShopForm() {
    const [form, setForm] = useState({
        image: '', latitude: null as number | null, longitude: null as number | null,
        address: '', mobilenumber: '', occupation: '', speclization: '',
        timeinHour: '', timeinPeriod: 'AM', timeoutHour: '', timeoutPeriod: 'PM', price: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const handleChange = (name: string, value: string) =>
        setForm((prev) => ({ ...prev, [name]: value }));

    const detectLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { Alert.alert("Permission denied", "Location permission is required."); return; }
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setForm((prev) => ({ ...prev, latitude, longitude }));
        try {
            // Use Expo's built-in reverse geocoder (no API key needed)
            const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geocoded && geocoded.length > 0) {
                const g = geocoded[0];
                const parts = [g.name, g.street, g.district, g.city, g.region, g.country].filter(Boolean);
                handleChange("address", parts.join(", "));
                setSuggestions([]);
            } else {
                Alert.alert("Error", "Could not determine address for your location.");
            }
        } catch { Alert.alert("Error", "Failed to fetch address. Check your internet connection."); }
    };

    const fetchSuggestions = async (text: string) => {
        handleChange("address", text);
        if (text.length < 4) { setSuggestions([]); return; }
        try {
            const resp = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_API_KEY}`
            );
            const data = await resp.json();
            setSuggestions(data.status === "OK" ? data.predictions.map((p: any) => p.description) : []);
        } catch { setSuggestions([]); }
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
        if (isNaN(inHour24) || isNaN(outHour24)) { Alert.alert('Error', 'Please enter valid hours'); return false; }
        if (outHour24 <= inHour24) { Alert.alert('Error', 'Time Out must be after Time In'); return false; }
        return true;
    };

    const handleSubmit = async () => {
        try {
            if (!validateTimings()) return;
            setIsSubmitting(true);
            await createAdminShop({
                ...form,
                latitude: form.latitude, longitude: form.longitude,
                timein: `${form.timeinHour} ${form.timeinPeriod}`,
                timeout: `${form.timeoutHour} ${form.timeoutPeriod}`,
                price: Number(form.price),
            });
            Alert.alert('Success', 'Shop created successfully!');
            router.replace('/adminfolder/');
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
            {/* Header */}
            <LinearGradient colors={['#1a1a2e', '#16213e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
                <TouchableOpacity onPress={() => router.replace('/adminfolder/')} style={styles.backBtn} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="white" />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.headerTitle}>New Listing</Text>
                    <Text style={styles.headerSub}>Fill in your shop details</Text>
                </View>
            </LinearGradient>

            <KeyboardAwareScrollView
                nestedScrollEnabled
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Section: Shop Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shop Information</Text>

                    <CustomInput
                        label="Image URL"
                        placeholder="https://example.com/image.jpg"
                        value={form.image}
                        onChangeText={(text) => handleChange('image', text)}
                    />

                    <View style={{ marginTop: 20, position: 'relative' }}>
                        <CustomInput
                            label="Address"
                            placeholder="Search or detect location"
                            value={form.address}
                            onChangeText={fetchSuggestions}
                            rightIcon={
                                <TouchableOpacity onPress={detectLocation} activeOpacity={0.7}>
                                    <Ionicons name="locate" size={20} color="#FE8C00" />
                                </TouchableOpacity>
                            }
                        />
                    </View>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <View style={styles.suggestions}>
                            {suggestions.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.suggestionItem, index < suggestions.length - 1 && styles.suggestionBorder]}
                                    onPress={async () => {
                                        handleChange("address", item);
                                        setSuggestions([]);
                                        try {
                                            const resp = await fetch(
                                                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(item)}&key=${GOOGLE_API_KEY}`
                                            );
                                            const data = await resp.json();
                                            if (data.status === "OK" && data.results.length > 0) {
                                                const loc = data.results[0].geometry.location;
                                                setForm((prev) => ({ ...prev, latitude: loc.lat, longitude: loc.lng }));
                                            }
                                        } catch { Alert.alert("Error", "Failed to fetch coordinates"); }
                                    }}
                                >
                                    <Ionicons name="location-outline" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
                                    <Text style={styles.suggestionText} numberOfLines={1}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={{ marginTop: 20 }}>
                        <CustomInput
                            label="Mobile Number"
                            placeholder="+91 98765 43210"
                            value={form.mobilenumber}
                            onChangeText={(text) => handleChange('mobilenumber', text)}
                            keyboardType="phone-pad"
                        />
                    </View>
                    <View style={{ marginTop: 20 }}>
                        <CustomInput
                            label="Occupation / Service Type"
                            placeholder="e.g. Barber, Tutor, Photographer"
                            value={form.occupation}
                            onChangeText={(text) => handleChange('occupation', text)}
                        />
                    </View>
                    <View style={{ marginTop: 20 }}>
                        <CustomInput
                            label="Specialization"
                            placeholder="e.g. Hair styling, Math, Portrait"
                            value={form.speclization}
                            onChangeText={(text) => handleChange('speclization', text)}
                        />
                    </View>
                </View>

                {/* Section: Availability */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Availability</Text>

                    {/* Time In */}
                    <Text style={styles.timeLabel}>Opening Time</Text>
                    <View style={styles.timeRow}>
                        <View style={{ flex: 1 }}>
                            <CustomInput
                                label="Hour (1–12)"
                                placeholder="9"
                                value={form.timeinHour}
                                onChangeText={(text) => handleChange('timeinHour', text)}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.pickerWrapper}>
                            <WheelPickerExpo
                                height={80}
                                initialSelectedIndex={form.timeinPeriod === 'AM' ? 0 : 1}
                                items={[{ label: 'AM', value: 'AM' }, { label: 'PM', value: 'PM' }]}
                                onChange={({ item }) => handleChange('timeinPeriod', item.value)}
                            />
                        </View>
                    </View>

                    {/* Time Out */}
                    <Text style={[styles.timeLabel, { marginTop: 16 }]}>Closing Time</Text>
                    <View style={styles.timeRow}>
                        <View style={{ flex: 1 }}>
                            <CustomInput
                                label="Hour (1–12)"
                                placeholder="6"
                                value={form.timeoutHour}
                                onChangeText={(text) => handleChange('timeoutHour', text)}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.pickerWrapper}>
                            <WheelPickerExpo
                                height={80}
                                initialSelectedIndex={form.timeoutPeriod === 'AM' ? 0 : 1}
                                items={[{ label: 'AM', value: 'AM' }, { label: 'PM', value: 'PM' }]}
                                onChange={({ item }) => handleChange('timeoutPeriod', item.value)}
                            />
                        </View>
                    </View>
                </View>

                {/* Section: Pricing */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pricing</Text>
                    <CustomInput
                        label="Price per Minute (₹)"
                        placeholder="e.g. 5"
                        value={form.price}
                        onChangeText={(text) => handleChange('price', text)}
                        keyboardType="numeric"
                    />
                    {form.price ? (
                        <View style={styles.pricePreview}>
                            <Ionicons name="pricetag-outline" size={16} color="#FE8C00" />
                            <Text style={styles.pricePreviewText}>
                                ₹{form.price}/min · ~₹{(Number(form.price) * 60).toFixed(0)}/hr
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* Submit */}
                <View style={{ marginTop: 8, marginBottom: 40 }}>
                    <CustomButton
                        title={isSubmitting ? 'Creating listing…' : 'Publish Listing'}
                        onPress={handleSubmit}
                        isLoading={isSubmitting}
                    />
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
    headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
    section: {
        backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    sectionTitle: {
        fontSize: 14, fontWeight: '800', color: '#111827',
        textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 20,
        borderLeftWidth: 3, borderLeftColor: '#FE8C00', paddingLeft: 10,
    },
    suggestions: {
        backgroundColor: 'white', borderRadius: 14, marginTop: 8,
        borderWidth: 1.5, borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
        overflow: 'hidden',
    },
    suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16 },
    suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    suggestionText: { fontSize: 13, color: '#374151', flex: 1 },
    timeLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 12 },
    timeRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
    pickerWrapper: {
        flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB',
        borderRadius: 14, overflow: 'hidden', height: 72, justifyContent: 'center',
        backgroundColor: '#F8F9FA',
    },
    pricePreview: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFF7ED', borderRadius: 10, padding: 12, marginTop: 12,
    },
    pricePreviewText: { color: '#D97706', fontSize: 14, fontWeight: '600' },
});