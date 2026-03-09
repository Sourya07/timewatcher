import React, { useState } from 'react';
import {
    View, Text, Alert, ScrollView, SafeAreaView,
    TouchableOpacity, StyleSheet, FlatList, Image
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
import { useThemeStore } from '@/Store/themeStore';

const GOOGLE_API_KEY = "AIzaSyA97WCu7Ld0sSnNWbgAfEouBfRqXSB8dnw";

import { LogBox } from 'react-native';
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

export default function AdminShopForm() {
    const { colors } = useThemeStore();
    const [form, setForm] = useState({
        image: '', latitude: null as number | null, longitude: null as number | null,
        address: '', mobilenumber: '', occupation: '', speclization: '',
        timeinHour: '', timeinPeriod: 'AM', timeoutHour: '', timeoutPeriod: 'PM', price: '',
        slotDuration: 30
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
                slotDuration: Number(form.slotDuration),
                isOpen: true
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
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                    onPress={() => router.replace('/adminfolder/')}
                    style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextWrapper}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>New Listing</Text>
                    <Text style={[styles.headerSub, { color: colors.textMuted }]}>Fill in your shop details</Text>
                </View>
            </View>

            <KeyboardAwareScrollView
                nestedScrollEnabled
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Section: Shop Info */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <View style={styles.sectionTitleWrapper}>
                        <View style={[styles.sectionTitleIcon, { backgroundColor: colors.background }]}>
                            <Ionicons name="business-outline" size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Shop Information</Text>
                    </View>

                    {form.image ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: form.image }} style={styles.imagePreview} resizeMode="cover" />
                            <View style={styles.imagePreviewOverlay} />
                        </View>
                    ) : null}

                    <CustomInput
                        label="Image URL"
                        placeholder="https://example.com/image.jpg"
                        value={form.image}
                        onChangeText={(text) => handleChange('image', text)}
                    />

                    <View style={{ marginTop: 24, position: 'relative' }}>
                        <CustomInput
                            label="Address"
                            placeholder="Search or detect location"
                            value={form.address}
                            onChangeText={fetchSuggestions}
                            rightIcon={
                                <TouchableOpacity onPress={detectLocation} activeOpacity={0.7} style={styles.locateBtn}>
                                    <Ionicons name="locate" size={18} color={colors.primary} />
                                </TouchableOpacity>
                            }
                        />
                    </View>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <View style={[styles.suggestions, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                                    <Ionicons name="location-outline" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
                                    <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={1}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={{ marginTop: 24 }}>
                        <CustomInput
                            label="Mobile Number"
                            placeholder="+91 98765 43210"
                            value={form.mobilenumber}
                            onChangeText={(text) => handleChange('mobilenumber', text)}
                            keyboardType="phone-pad"
                        />
                    </View>
                    <View style={{ marginTop: 24 }}>
                        <CustomInput
                            label="Occupation / Service Type"
                            placeholder="e.g. Barber, Tutor, Photographer"
                            value={form.occupation}
                            onChangeText={(text) => handleChange('occupation', text)}
                        />
                    </View>
                    <View style={{ marginTop: 24 }}>
                        <CustomInput
                            label="Specialization"
                            placeholder="e.g. Hair styling, Math, Portrait"
                            value={form.speclization}
                            onChangeText={(text) => handleChange('speclization', text)}
                        />
                    </View>
                </View>

                {/* Section: Availability */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <View style={styles.sectionTitleWrapper}>
                        <View style={[styles.sectionTitleIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="time-outline" size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Availability</Text>
                    </View>

                    {/* Time In */}
                    <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Opening Time</Text>
                    <View style={styles.timeRow}>
                        <View style={{ flex: 1.5 }}>
                            <CustomInput
                                label="Hour (1–12)"
                                placeholder="9"
                                value={form.timeinHour}
                                onChangeText={(text) => handleChange('timeinHour', text)}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.pickerWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <WheelPickerExpo
                                height={70}
                                initialSelectedIndex={form.timeinPeriod === 'AM' ? 0 : 1}
                                items={[{ label: 'AM', value: 'AM' }, { label: 'PM', value: 'PM' }]}
                                onChange={({ item }) => handleChange('timeinPeriod', item.value)}
                            />
                        </View>
                    </View>

                    {/* Time Out */}
                    <Text style={[styles.timeLabel, { marginTop: 24, color: colors.textMuted }]}>Closing Time</Text>
                    <View style={styles.timeRow}>
                        <View style={{ flex: 1.5 }}>
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
                                height={70}
                                initialSelectedIndex={form.timeoutPeriod === 'AM' ? 0 : 1}
                                items={[{ label: 'AM', value: 'AM' }, { label: 'PM', value: 'PM' }]}
                                onChange={({ item }) => handleChange('timeoutPeriod', item.value)}
                            />
                        </View>
                    </View>
                </View>

                {/* Section: Pricing & Settings */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <View style={styles.sectionTitleWrapper}>
                        <View style={[styles.sectionTitleIcon, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="pricetag-outline" size={18} color="#10B981" />
                        </View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing & Settings</Text>
                    </View>
                    
                    <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Slot Duration</Text>
                    <View style={styles.timeRow}>
                        <View
                            style={[
                                styles.pickerWrapper,
                                {
                                    height: 90,
                                    marginBottom: 24,
                                    flex: 1,
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <WheelPickerExpo
                                height={90}
                                initialSelectedIndex={form.slotDuration === 15 ? 0 : form.slotDuration === 30 ? 1 : 2}
                                items={[
                                    { label: '15 Mins', value: 15 }, 
                                    { label: '30 Mins', value: 30 }, 
                                    { label: '60 Mins', value: 60 }
                                ]}
                                onChange={({ item }) => handleChange('slotDuration', item.value)}
                            />
                        </View>
                    </View>

                    <CustomInput
                        label={`Price per Slot (${form.slotDuration} min) (₹)`}
                        placeholder="e.g. 50"
                        value={form.price}
                        onChangeText={(text) => handleChange('price', text)}
                        keyboardType="numeric"
                    />
                    {form.price ? (
                        <View
                            style={[
                                styles.pricePreview,
                                { backgroundColor: colors.background, borderColor: colors.border },
                            ]}
                        >
                            <Ionicons name="information-circle-outline" size={18} color={colors.warning} />
                            <Text style={[styles.pricePreviewText, { color: colors.textMuted }]}>
                                Customers will pay ₹{form.price} for a {form.slotDuration} min appointment
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* Submit */}
                <View style={styles.submitWrapper}>
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
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'white',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 3,
        borderWidth: 1, borderColor: '#F3F4F6'
    },
    headerTextWrapper: { flex: 1, marginLeft: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, marginTop: 2, fontWeight: '500' },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 60 },
    section: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
    },
    sectionTitleWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    sectionTitleIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    imagePreviewContainer: {
        width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 24, backgroundColor: '#F3F4F6',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
    },
    imagePreview: { width: '100%', height: '100%' },
    imagePreviewOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.02)' },
    locateBtn: { padding: 6, backgroundColor: '#FFF7ED', borderRadius: 8 },
    suggestions: {
        borderRadius: 16,
        marginTop: 8,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
        overflow: 'hidden',
    },
    suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
    suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    suggestionText: { fontSize: 14, flex: 1, fontWeight: '500' },
    timeLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    timeRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-end' },
    pickerWrapper: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
        height: 70,
        justifyContent: 'center',
    },
    pricePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
    },
    pricePreviewText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
    submitWrapper: { marginTop: 12, marginBottom: 40, paddingHorizontal: 4 },
});
