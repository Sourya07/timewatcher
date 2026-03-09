import { View, Text, Image, ScrollView, ActivityIndicator, Pressable, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useShopStore } from '@/Store/shopstore';
import { useState, useEffect } from 'react';
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import apiClient from '@/constants/axiosInstance';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const GOOGLE_MAPS_APIKEY = "AIzaSyA97WCu7Ld0sSnNWbgAfEouBfRqXSB8dnw";

export default function ShopDetails() {
    const router = useRouter();
    const userLocation = { latitude: 27.1027378242211, longitude: 83.2817002769377 };
    const { id } = useLocalSearchParams<{ id: string }>();
    const getShopById = useShopStore((state) => state.getShopById);
    const shop = getShopById(id);

    if (!shop) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.emptyIcon}>🏚</Text>
                <Text style={styles.emptyTitle}>Shop not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.goBackBtn}>
                    <Text style={styles.goBackText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

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

    const startMinutes = time12hToMinutes(String(shop.timein || "09:00 AM"));
    const rawEndMinutes = time12hToMinutes(String(shop.timeout || "05:00 PM"));
    // If timeout is missing or same as timein, default to 1 hour later for usability
    const endMinutes = (rawEndMinutes <= startMinutes) ? startMinutes + 60 : rawEndMinutes;
 
    // State for start and end minutes
    const [startVal, setStartVal] = useState(startMinutes);
    const [endVal, setEndVal] = useState(endMinutes);
 
    // Synchronize state if shop data changes (like moving between shops)
    useEffect(() => {
        const sm = time12hToMinutes(String(shop.timein || "09:00 AM"));
        const rem = time12hToMinutes(String(shop.timeout || "05:00 PM"));
        const em = (rem <= sm) ? sm + 60 : rem;
        setStartVal(sm);
        setEndVal(em);
    }, [shop.timein, shop.timeout]);

    // Derive everything from the numeric state directly to avoid re-render loops
    const startTimeStr = minutesToTime12h(startVal);
    const endTimeStr = minutesToTime12h(endVal);
    const selectedTimeRange = `${startTimeStr} - ${endTimeStr}`;
    const timeDifference = Math.max(0, endVal - startVal);

    const adjustTime = (type: 'start' | 'end', delta: number) => {
        if (type === 'start') {
            // Allow start to move within [startMinutes, endVal - 1]
            const next = Math.max(startMinutes, Math.min(endVal - 1, startVal + delta));
            setStartVal(next);
        } else {
            // Allow end to move within [startVal + 1, endMinutes]
            const next = Math.min(endMinutes, Math.max(startVal + 1, endVal + delta));
            setEndVal(next);
        }
    };

    const shopPrice = Number(shop?.price || 0);
    const totalPrice = (shopPrice * timeDifference) || 0;

    const handleBooking = async () => {
        if (timeDifference <= 0) {
            Alert.alert("Invalid Duration", "Please select a valid time range.");
            return;
        }

        try {
            await apiClient.post("/api/v1/booking/", {
                shopId: Number(id),
                duration: timeDifference,
                price: totalPrice,
                startTime: startTimeStr,
                endTime: endTimeStr
            });
            Alert.alert("✅ Booking Confirmed!", `Your appointment is booked for ${selectedTimeRange}`);
            router.push('/(tabs)/cart');
        } catch (error: any) {
            Alert.alert("Booking Failed", error.message || "Please try again.");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.locationInfo}>
                    <Ionicons name="location-sharp" size={14} color="#FE8C00" />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {shop.address ? shop.address.split(" ").slice(0, 4).join(" ") : "Location"}
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Shop Header Card */}
                <View style={styles.shopHeaderCard}>
                    <Image
                        source={{ uri: shop.image || 'https://via.placeholder.com/400x200' }}
                        style={styles.shopImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.75)']}
                        style={styles.shopImageOverlay}
                    />
                    <View style={styles.shopHeaderInfo}>
                        <View style={styles.openBadge}>
                            <View style={styles.openDot} />
                            <Text style={styles.openText}>Open Now</Text>
                        </View>
                        <Text style={styles.shopOccupation}>{shop.occupation || "Service Provider"}</Text>
                        <Text style={styles.shopSpec}>{shop.speclization}</Text>
                    </View>
                </View>

                {/* Info Cards Row */}
                <View style={styles.infoRow}>
                    <View style={styles.infoCard}>
                        <Ionicons name="time-outline" size={18} color="#FE8C00" />
                        <Text style={styles.infoCardLabel}>Hours</Text>
                        <Text style={styles.infoCardValue}>{shop.timein}</Text>
                        <Text style={styles.infoCardValue}>{shop.timeout}</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Ionicons name="call-outline" size={18} color="#6366F1" />
                        <Text style={styles.infoCardLabel}>Mobile</Text>
                        <Text style={styles.infoCardValue} numberOfLines={1}>{shop.mobilenumber || "N/A"}</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Ionicons name="pricetag-outline" size={18} color="#10B981" />
                        <Text style={styles.infoCardLabel}>Rate</Text>
                        <Text style={styles.infoCardValue}>₹{shop.price}</Text>
                        <Text style={styles.infoCardSub}>/min</Text>
                    </View>
                </View>

                {/* Map */}
                <View style={styles.mapCard}>
                    <Text style={styles.cardTitle}>📍 Location & Route</Text>
                    <View style={styles.mapWrapper}>
                        <MapView
                            style={{ flex: 1 }}
                            initialRegion={{
                                latitude: (userLocation.latitude + shop.latitude) / 2,
                                longitude: (userLocation.longitude + shop.longitude) / 2,
                                latitudeDelta: Math.abs(userLocation.latitude - shop.latitude) + 0.05,
                                longitudeDelta: Math.abs(userLocation.longitude - shop.longitude) + 0.05,
                            }}
                        >
                            <Marker coordinate={userLocation} title="You" pinColor="red" />
                            <Marker coordinate={{ latitude: shop.latitude, longitude: shop.longitude }} title={shop.occupation || "Shop"}>
                                <View style={styles.shopMarker}>
                                    <Image
                                        source={{ uri: shop.image || 'https://via.placeholder.com/60' }}
                                        style={styles.shopMarkerImage}
                                    />
                                </View>
                            </Marker>
                            <MapViewDirections
                                origin={userLocation}
                                destination={{ latitude: shop.latitude, longitude: shop.longitude }}
                                apikey={GOOGLE_MAPS_APIKEY}
                                strokeWidth={4}
                                strokeColor="#FE8C00"
                            />
                        </MapView>
                    </View>
                    <Text style={styles.addressText}>{shop.address}</Text>
                </View>

                {/* Time Picker */}
                <View style={styles.timePickerCard}>
                    <Text style={styles.cardTitle}>⏱ Select Your Time</Text>
                    <View style={{ marginTop: 8 }}>
                        {/* Start Time Adjuster */}
                        <View style={styles.adjusterRow}>
                            <Text style={styles.adjusterLabel}>START TIME</Text>
                            <View style={styles.adjusterControls}>
                                <TouchableOpacity onPress={() => adjustTime('start', -15)} style={styles.adjustBtn} activeOpacity={0.6}>
                                    <Ionicons name="remove" size={20} color="#374151" />
                                </TouchableOpacity>
                                <View style={styles.adjusterValueBox}>
                                    <Text style={styles.adjusterValueText}>{startTimeStr}</Text>
                                </View>
                                <TouchableOpacity onPress={() => adjustTime('start', 15)} style={styles.adjustBtn} activeOpacity={0.6}>
                                    <Ionicons name="add" size={20} color="#374151" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* End Time Adjuster */}
                        <View style={[styles.adjusterRow, { marginTop: 16 }]}>
                            <Text style={styles.adjusterLabel}>END TIME</Text>
                            <View style={styles.adjusterControls}>
                                <TouchableOpacity onPress={() => adjustTime('end', -15)} style={styles.adjustBtn} activeOpacity={0.6}>
                                    <Ionicons name="remove" size={20} color="#374151" />
                                </TouchableOpacity>
                                <View style={styles.adjusterValueBox}>
                                    <Text style={styles.adjusterValueText}>{endTimeStr}</Text>
                                </View>
                                <TouchableOpacity onPress={() => adjustTime('end', 15)} style={styles.adjustBtn} activeOpacity={0.6}>
                                    <Ionicons name="add" size={20} color="#374151" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* About */}
                <View style={styles.aboutCard}>
                    <Text style={styles.cardTitle}>ℹ About</Text>
                    <Text style={styles.aboutText}>
                        Book any available time slot with {shop.occupation || "this service provider"}.
                        Pay only for the time you use. No hidden charges.
                    </Text>
                </View>

                {/* Spacer for sticky button */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Book Button */}
            <View style={styles.stickyBottom}>
                <View style={styles.stickyPriceInfo}>
                    <Text style={styles.stickyPriceLabel}>Total Value</Text>
                    <Text style={styles.stickyPrice}>₹{Math.max(0, totalPrice).toLocaleString()}</Text>
                    <Text style={styles.stickyPriceDuration}>for {timeDifference} min selection</Text>
                </View>
                <TouchableOpacity onPress={handleBooking} activeOpacity={0.85} style={styles.bookBtnWrapper}>
                    <LinearGradient colors={['#FF8C00', '#FF5F00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bookBtn}>
                        <Text style={styles.bookBtnText}>Book Appointment</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#374151' },
    goBackBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 28, backgroundColor: '#FE8C00', borderRadius: 14 },
    goBackText: { color: 'white', fontWeight: '700' },
    topBar: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 12, backgroundColor: 'white',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19, backgroundColor: '#F3F4F6',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    locationText: { fontSize: 14, color: '#374151', fontWeight: '600', flex: 1 },
    scrollContent: { paddingBottom: 40 },
    shopHeaderCard: { position: 'relative', height: 220, marginHorizontal: 16, marginTop: 12, borderRadius: 20, overflow: 'hidden' },
    shopImage: { width: '100%', height: '100%' },
    shopImageOverlay: { ...StyleSheet.absoluteFillObject },
    shopHeaderInfo: { position: 'absolute', bottom: 16, left: 16, right: 16 },
    openBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.4)',
        borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8,
    },
    openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
    openText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
    shopOccupation: { color: 'white', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    shopSpec: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
    infoRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 12 },
    infoCard: {
        flex: 1, backgroundColor: 'white', borderRadius: 16, padding: 14, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    infoCardLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6, marginBottom: 4 },
    infoCardValue: { fontSize: 13, color: '#111827', fontWeight: '700', textAlign: 'center' },
    infoCardSub: { fontSize: 10, color: '#9CA3AF' },
    mapCard: {
        backgroundColor: 'white', borderRadius: 20, marginHorizontal: 16, marginTop: 12,
        padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 14 },
    mapWrapper: { height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
    shopMarker: { padding: 3, backgroundColor: 'white', borderRadius: 25, borderWidth: 2, borderColor: '#FE8C00' },
    shopMarkerImage: { width: 40, height: 40, borderRadius: 20 },
    addressText: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
    timePickerCard: {
        backgroundColor: 'white', borderRadius: 20, marginHorizontal: 16, marginTop: 12,
        padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    timeDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
    timeChip: { backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', minWidth: 72 },
    timeChipLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    timeChipValue: { fontSize: 14, color: '#111827', fontWeight: '800', marginTop: 2 },
    timeArrow: { paddingHorizontal: 2 },
    aboutCard: {
        backgroundColor: 'white', borderRadius: 20, marginHorizontal: 16, marginTop: 12,
        padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    aboutText: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
    stickyBottom: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 14,
        borderTopWidth: 1, borderTopColor: '#F3F4F6',
        flexDirection: 'row', alignItems: 'center', gap: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 12,
    },
    stickyPriceInfo: { flex: 1 },
    stickyPriceLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
    stickyPrice: { fontSize: 24, fontWeight: '800', color: '#111827' },
    stickyPriceDuration: { fontSize: 11, color: '#9CA3AF' },
    bookBtnWrapper: { flex: 2, borderRadius: 16, overflow: 'hidden', shadowColor: '#FF8C00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
    bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    bookBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
    
    // Adjuster Styles
    adjusterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    adjusterLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
    adjusterControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    adjustBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    adjusterValueBox: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 100, alignItems: 'center' },
    adjusterValueText: { fontSize: 15, fontWeight: '700', color: '#111827' },
});

