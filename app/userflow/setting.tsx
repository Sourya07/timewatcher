import React, { useState } from "react";
import {
    View, Text, TextInput, Pressable, Keyboard,
    TouchableWithoutFeedback, Alert, ScrollView,
    StyleSheet, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { router } from "expo-router";
import { saveUserDetails } from "@/constants/userApi";
import BackButton from "@/components/BackButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "@/Store/themeStore";

const GOOGLE_API_KEY = "AIzaSyA97WCu7Ld0sSnNWbgAfEouBfRqXSB8dnw";

export default function LocationScreen() {
    const [location, setLocation] = useState("");
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [detecting, setDetecting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [focused, setFocused] = useState(false);
    const { colors } = useThemeStore();

    const detectLocation = async () => {
        setDetecting(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") { Alert.alert("Permission denied", "Location permission is required."); return; }
            let loc = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = loc.coords;
            setCoords({ latitude, longitude });
            // Use Expo's built-in reverse geocoder (no API key needed)
            const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geocoded && geocoded.length > 0) {
                const g = geocoded[0];
                const parts = [g.name, g.street, g.district, g.city, g.region, g.country].filter(Boolean);
                setLocation(parts.join(", "));
                setSuggestions([]);
            } else {
                Alert.alert("Error", "Could not determine address for your location.");
            }
        } catch { Alert.alert("Error", "Failed to fetch address. Check your internet connection."); }
        finally { setDetecting(false); }
    };

    const fetchSuggestions = async (text: string) => {
        setLocation(text);
        if (text.length < 4) { setSuggestions([]); return; }
        try {
            const resp = await fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_API_KEY}`
            );
            const data = await resp.json();
            setSuggestions(data.status === "OK" ? data.predictions.map((p: any) => p.description) : []);
        } catch { setSuggestions([]); }
    };

    const handleSuggestionPress = async (address: string) => {
        setLocation(address); setSuggestions([]);
        try {
            const resp = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
            );
            const data = await resp.json();
            if (data.status === "OK") {
                const loc = data.results[0].geometry.location;
                setCoords({ latitude: loc.lat, longitude: loc.lng });
            } else Alert.alert("Error", "Failed to get coordinates");
        } catch { Alert.alert("Error", "Failed to fetch coordinates"); }
    };

    const handleSubmit = async () => {
        if (!coords || !location) { Alert.alert("Missing info", "Please enter or detect your location."); return; }
        setSubmitting(true);
        try {
            await saveUserDetails({
                image: "https://example.com/default.jpg",
                latitude: coords.latitude,
                longitude: coords.longitude,
                address: location,
                mobilenumber: "please enter your mobile no",
            });
            router.replace("/(tabs)/profile" as any);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to submit location.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.root, { backgroundColor: colors.primary }]}>
                <BackButton style={{ position: 'absolute', top: 56, left: 16, zIndex: 10 }} iconColor="white" backgroundColor="rgba(255,255,255,0.2)" />
                {/* Gradient top portion */}
                <LinearGradient
                    colors={[colors.headerGradientStart, colors.headerGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.circle1} />
                    <View style={styles.circle2} />
                    <View style={styles.heroContent}>
                        <View style={styles.heroIconWrapper}>
                            <Ionicons name="location" size={32} color="white" />
                        </View>
                        <Text style={styles.heroTitle}>Where are you?</Text>
                        <Text style={styles.heroSub}>We'll find services near you</Text>
                    </View>
                </LinearGradient>

                {/* White Card */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
                        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                            <Text style={[styles.cardTitle, { color: colors.text }]}>Enter your location</Text>

                            {/* Search Input */}
                            <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
                                <Ionicons name="search-outline" size={18} color={focused ? colors.primary : '#9CA3AF'} />
                                <TextInput
                                    value={location}
                                    onChangeText={fetchSuggestions}
                                    placeholder="Start typing your address…"
                                    placeholderTextColor="#BDBDBD"
                                    style={[styles.searchInput, { color: colors.text }]}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    autoCorrect={false}
                                />
                                {location.length > 0 && (
                                    <TouchableOpacity onPress={() => { setLocation(''); setSuggestions([]); }} activeOpacity={0.7}>
                                        <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Suggestions */}
                            {suggestions.length > 0 && (
                                <View style={styles.suggestions}>
                                    {suggestions.map((s, i) => (
                                        <TouchableOpacity
                                            key={i}
                                            onPress={() => handleSuggestionPress(s)}
                                            style={[styles.suggestionItem, i < suggestions.length - 1 && styles.suggestionBorder]}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.suggestionIcon}>
                                                <Ionicons name="location-outline" size={14} color={colors.primary} />
                                            </View>
                                            <Text style={styles.suggestionText} numberOfLines={2}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {/* Coords confirmation */}
                            {coords && (
                                <View style={styles.coordsConfirm}>
                                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                    <Text style={styles.coordsText}>Location pinned successfully</Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Action Buttons */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                onPress={detectLocation}
                                style={styles.detectBtn}
                                activeOpacity={0.8}
                                disabled={detecting}
                            >
                                {detecting ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <Ionicons name="navigate" size={18} color={colors.primary} />
                                )}
                                <Text style={styles.detectBtnText}>
                                    {detecting ? 'Detecting…' : 'Use My Current Location'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleSubmit} activeOpacity={0.85} disabled={submitting} style={styles.submitBtnWrapper}>
                                <LinearGradient
                                    colors={[colors.primary, colors.headerGradientEnd]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitBtn}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <>
                                            <Text style={styles.submitBtnText}>Confirm Location</Text>
                                            <Ionicons name="arrow-forward" size={18} color="white" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    gradient: { height: 240, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 32, overflow: 'hidden' },
    circle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -50 },
    circle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', top: 60, left: -40 },
    heroContent: { alignItems: 'flex-start' },
    heroIconWrapper: {
        width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    heroTitle: { color: 'white', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
    heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 6 },
    card: {
        flex: 1, backgroundColor: 'white',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingHorizontal: 20, paddingTop: 28,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#F8F9FA', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB',
        paddingHorizontal: 16, paddingVertical: 4,
    },
    searchBoxFocused: { borderColor: '#1877F2', backgroundColor: '#E7F0FF' },
    searchInput: { flex: 1, fontSize: 15, color: '#1F2937', paddingVertical: 14 },
    suggestions: {
        backgroundColor: 'white', borderRadius: 14, marginTop: 8, borderWidth: 1.5, borderColor: '#E5E7EB',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4, overflow: 'hidden',
    },
    suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    suggestionIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    suggestionText: { fontSize: 13, color: '#374151', flex: 1, lineHeight: 18 },
    coordsConfirm: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#D1FAE5', borderRadius: 10, padding: 12, marginTop: 12,
    },
    coordsText: { color: '#059669', fontSize: 13, fontWeight: '600' },
    actions: { paddingBottom: 16, gap: 12 },
    detectBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        borderWidth: 1.5, borderColor: '#FED7AA', borderRadius: 16,
        paddingVertical: 16, backgroundColor: '#FFF7ED',
    },
    detectBtnText: { color: '#1877F2', fontSize: 15, fontWeight: '700' },
    submitBtnWrapper: { borderRadius: 16, overflow: 'hidden', shadowColor: '#1877F2', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
});