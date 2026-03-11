import React, { useState } from 'react';
import {
    View, Text, Alert, ScrollView, SafeAreaView,
    TouchableOpacity, StyleSheet, Image, Modal
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '@/components/Custominput';
import CustomButton from '@/components/Custombutton';
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
        address: '', mobilenumber: '', occupation: 'Doctor', speclization: '',
        timeinHour: '', timeinPeriod: 'AM', timeoutHour: '', timeoutPeriod: 'PM'
    });

    const OCCUPATION_OPTIONS = [
        { label: 'Doctor', value: 'Doctor' },
        { label: 'Advocate', value: 'Advocate' },
        { label: 'Barber', value: 'Barber' },
        { label: 'Teacher', value: 'Teacher' },
        { label: 'Courier', value: 'Courier' },
        { label: 'Photographer', value: 'Photographer' },
        { label: 'Government Services', value: 'Government Services' },
        { label: 'Other', value: 'Other' },
    ];
    
    const [services, setServices] = useState([
        { id: Date.now().toString(), name: '', price: '', durationMins: 30 }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [occModalVisible, setOccModalVisible] = useState(false);

    const handleServiceChange = (id: string, field: string, value: string | number) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const addService = () => {
        setServices(prev => [...prev, { id: Date.now().toString(), name: '', price: '', durationMins: 30 }]);
    };

    const removeService = (id: string) => {
        if (services.length === 1) {
            Alert.alert('Error', 'You must have at least one service');
            return;
        }
        setServices(prev => prev.filter(s => s.id !== id));
    };

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
        
        // Validate services
        for (const s of services) {
            if (!s.name.trim() || !s.price) {
                Alert.alert('Error', 'Please fill in all service names and prices');
                return false;
            }
        }
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
                isOpen: true,
                categoryName: form.occupation,
                services: services.map(s => ({
                    name: s.name,
                    price: Number(s.price),
                    durationMins: Number(s.durationMins)
                }))
            });
            Alert.alert('Success', 'Shop created successfully!');
            router.replace('/adminfolder');
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
                    onPress={() => router.replace('/adminfolder')}
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
                        <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Occupation / Category</Text>
                        <TouchableOpacity
                            onPress={() => setOccModalVisible(true)}
                            style={[styles.dropdownBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                            activeOpacity={0.8}
                        >
                            <Text style={{ fontSize: 16, color: form.occupation ? colors.text : colors.textMuted, fontWeight: '500' }}>
                                {form.occupation || 'Select Category'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
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
                        <View style={[styles.toggleWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            {['AM', 'PM'].map((period) => {
                                const isActive = form.timeinPeriod === period;
                                return (
                                    <TouchableOpacity
                                        key={period}
                                        onPress={() => handleChange('timeinPeriod', period)}
                                        style={[styles.toggleBtn, isActive && { backgroundColor: colors.primary }]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.toggleText, isActive ? { color: 'white' } : { color: colors.text }]}>
                                            {period}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
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
                        <View style={[styles.toggleWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            {['AM', 'PM'].map((period) => {
                                const isActive = form.timeoutPeriod === period;
                                return (
                                    <TouchableOpacity
                                        key={period}
                                        onPress={() => handleChange('timeoutPeriod', period)}
                                        style={[styles.toggleBtn, isActive && { backgroundColor: colors.primary }]}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.toggleText, isActive ? { color: 'white' } : { color: colors.text }]}>
                                            {period}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Section: Services List */}
                <View style={[styles.section, { backgroundColor: colors.surface }]}>
                    <View style={styles.sectionTitleWrapper}>
                        <View style={[styles.sectionTitleIcon, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="pricetag-outline" size={18} color="#10B981" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Services Menu</Text>
                            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>Add variants or distinct services</Text>
                        </View>
                        <TouchableOpacity style={{ padding: 6, backgroundColor: colors.primary + '1A', borderRadius: 8 }} onPress={addService}>
                            <Ionicons name="add" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {services.map((svc, index) => (
                        <View key={svc.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottomWidth: index < services.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Service #{index + 1}</Text>
                                {services.length > 1 && (
                                    <TouchableOpacity onPress={() => removeService(svc.id)}>
                                        <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '600' }}>Remove</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <CustomInput
                                label="Service Name"
                                placeholder="e.g. Haircut, Online Consultation"
                                value={svc.name}
                                onChangeText={(text) => handleServiceChange(svc.id, 'name', text)}
                            />

                            <View style={{ flexDirection: 'row', gap: 16, marginTop: 16, alignItems: 'flex-end' }}>
                                <View style={{ flex: 1.2 }}>
                                    <CustomInput
                                        label="Price (₹)"
                                        placeholder="e.g. 500"
                                        value={svc.price}
                                        onChangeText={(text) => handleServiceChange(svc.id, 'price', text)}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.timeLabel, { color: colors.textMuted }]}>Duration (Mins)</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                                        {[15, 30, 45, 60, 90, 120].map((mins) => {
                                            const isActive = svc.durationMins === mins;
                                            return (
                                                <TouchableOpacity
                                                    key={mins}
                                                    onPress={() => handleServiceChange(svc.id, 'durationMins', mins)}
                                                    style={{
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 12,
                                                        borderRadius: 12,
                                                        backgroundColor: isActive ? colors.primary : colors.background,
                                                        borderWidth: 1,
                                                        borderColor: isActive ? colors.primary : colors.border,
                                                    }}
                                                >
                                                    <Text style={{ fontWeight: '600', color: isActive ? 'white' : colors.text }}>
                                                        {mins}m
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.submitWrapper}>
                    <CustomButton
                        title={isSubmitting ? 'Creating listing…' : 'Publish Listing'}
                        onPress={handleSubmit}
                        isLoading={isSubmitting}
                    />
                </View>
            </KeyboardAwareScrollView>

            {/* Occupation Modal */}
            <Modal visible={occModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setOccModalVisible(false)} />
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
                            <TouchableOpacity onPress={() => setOccModalVisible(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.modalScroll}>
                            {OCCUPATION_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => { handleChange('occupation', opt.value); setOccModalVisible(false); }}
                                    style={[styles.modalOption, form.occupation === opt.value && { backgroundColor: colors.primary + '1A' }]}
                                >
                                    <Text style={[styles.modalOptionText, { color: form.occupation === opt.value ? colors.primary : colors.text }]}>
                                        {opt.label}
                                    </Text>
                                    {form.occupation === opt.value && (
                                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    toggleWrapper: {
        flex: 1,
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 12,
        overflow: 'hidden',
        height: 52,
    },
    toggleBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '700',
    },
    dropdownBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 56,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalDismiss: { flex: 1 },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: { fontSize: 18, fontWeight: '800' },
    modalCloseBtn: { padding: 4, backgroundColor: '#F3F4F6', borderRadius: 16 },
    modalScroll: { padding: 20 },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    modalOptionText: { fontSize: 16, fontWeight: '600' },
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
