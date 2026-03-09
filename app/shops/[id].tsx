import { View, Text, Image, ScrollView, ActivityIndicator, Pressable, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useShopStore } from '@/Store/shopstore';
import { useState, useEffect, useCallback } from 'react';
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getShopSlots, createBooking } from '@/constants/bookingApi';
import { useThemeStore } from '@/Store/themeStore';

const GOOGLE_MAPS_APIKEY = "AIzaSyA97WCu7Ld0sSnNWbgAfEouBfRqXSB8dnw";

export default function ShopDetails() {
    const router = useRouter();
    const { colors } = useThemeStore();
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

    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [slots, setSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Generate next 7 dates
    const next7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
            dateStr: d.toISOString().split('T')[0],
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNum: d.getDate()
        };
    });

    useFocusEffect(
        useCallback(() => {
            fetchSlots(selectedDate);
        }, [selectedDate, id])
    );

    const fetchSlots = async (dateStr: string) => {
        setIsLoadingSlots(true);
        setSelectedSlot(null);
        try {
            const res = await getShopSlots(Number(id), dateStr);
            setSlots(res.slots || []);
        } catch (error) {
            console.error("Failed to fetch slots", error);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const shopPrice = Number(shop?.price || 0);
    const durationMins = shop?.slotDuration ? Number(shop.slotDuration) : 30;
    const totalPrice = shopPrice; // now treated as price per slot directly

    const handleBooking = async () => {
        if (!selectedSlot) {
            Alert.alert("Invalid Duration", "Please select an available time slot.");
            return;
        }

        try {
            await createBooking({
                shopId: Number(id),
                duration: durationMins,
                price: totalPrice,
                bookingStart: selectedSlot.startTime,
                bookingEnd: selectedSlot.endTime
            });
            Alert.alert("✅ Booking Confirmed!", `Your appointment is booked for ${selectedSlot.time}`);
            router.push('/(tabs)/cart' as any);
        } catch (error: any) {
            Alert.alert("Booking Failed", error?.response?.data?.message || error.message || "Please try again.");
            fetchSlots(selectedDate); // Refresh slots
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            {/* Top bar */}
            <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.background }]} activeOpacity={0.8}>
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.locationInfo}>
                    <Ionicons name="location-sharp" size={14} color={colors.primary} />
                    <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
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
                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <Text style={[styles.infoCardLabel, { color: colors.textMuted }]}>Hours</Text>
                        <Text style={[styles.infoCardValue, { color: colors.text }]}>{shop.timein}</Text>
                        <Text style={[styles.infoCardValue, { color: colors.text }]}>{shop.timeout}</Text>
                    </View>
                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <Ionicons name="call-outline" size={18} color="#6366F1" />
                        <Text style={[styles.infoCardLabel, { color: colors.textMuted }]}>Mobile</Text>
                        <Text style={[styles.infoCardValue, { color: colors.text }]} numberOfLines={1}>{shop.mobilenumber || "N/A"}</Text>
                    </View>
                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <Ionicons name="pricetag-outline" size={18} color={colors.success} />
                        <Text style={[styles.infoCardLabel, { color: colors.textMuted }]}>Rate</Text>
                        <Text style={[styles.infoCardValue, { color: colors.text }]}>₹{shopPrice}</Text>
                        <Text style={styles.infoCardSub}>/ slot</Text>
                    </View>
                </View>

                {/* Map */}
                <View style={[styles.mapCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>📍 Location & Route</Text>
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
                                strokeColor={colors.primary}
                            />
                        </MapView>
                    </View>
                    <Text style={[styles.addressText, { color: colors.textMuted }]}>{shop.address}</Text>
                </View>

                {/* Date & Slot Picker */}
                <View style={[styles.timePickerCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>📅 Select Date & Time</Text>
                    
                    {/* Date Selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
                        {next7Days.map((d, idx) => {
                            const isSelected = selectedDate === d.dateStr;
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => setSelectedDate(d.dateStr)}
                                    style={[
                                        styles.dateChip,
                                        { backgroundColor: isSelected ? colors.primary : colors.background }
                                    ]}
                                >
                                    <Text style={[styles.dateChipDayName, { color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textMuted }]}>{d.dayName}</Text>
                                    <Text style={[styles.dateChipDayNum, { color: isSelected ? 'white' : colors.text }]}>{d.dayNum}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Slots Grid */}
                    {isLoadingSlots ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : slots.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: colors.textMuted }}>No slots available for this date.</Text>
                        </View>
                    ) : (
                        <View style={styles.slotsGrid}>
                            {slots.map((slot: any, idx) => {
                                const isSelected = selectedSlot?.startTime === slot.startTime;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        disabled={slot.isBooked}
                                        onPress={() => setSelectedSlot(slot)}
                                        style={[
                                            styles.slotChip,
                                            slot.isBooked && styles.slotChipBooked,
                                            isSelected && styles.slotChipSelected
                                        ]}
                                    >
                                        <Text style={[
                                            styles.slotChipText,
                                            slot.isBooked && styles.slotChipTextBooked,
                                            isSelected && styles.slotChipTextSelected
                                        ]}>
                                            {slot.time}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* About */}
                <View style={[styles.aboutCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>ℹ About</Text>
                    <Text style={[styles.aboutText, { color: colors.textMuted }]}>
                        Book any available time slot with {shop.occupation || "this service provider"}.
                        Pay only for the time you use. No hidden charges.
                    </Text>
                </View>

                {/* Spacer for sticky button */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Book Button */}
            <View style={[styles.stickyBottom, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <View style={styles.stickyPriceInfo}>
                    <Text style={[styles.stickyPriceLabel, { color: colors.textMuted }]}>Total Value</Text>
                    <Text style={[styles.stickyPrice, { color: colors.text }]}>₹{Math.max(0, totalPrice).toLocaleString()}</Text>
                    <Text style={[styles.stickyPriceDuration, { color: colors.textMuted }]}>for {durationMins} min session</Text>
                </View>
                <TouchableOpacity onPress={handleBooking} activeOpacity={0.85} style={[styles.bookBtnWrapper, { shadowColor: colors.primary }]} disabled={!selectedSlot}>
                    <LinearGradient colors={selectedSlot ? [colors.primary, colors.headerGradientEnd] : ['#D1D5DB', '#9CA3AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bookBtn}>
                        <Text style={styles.bookBtnText}>Book Appointment</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyIcon: { fontSize: 52, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700' },
    goBackBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 },
    goBackText: { color: 'white', fontWeight: '700' },
    topBar: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 12, borderBottomWidth: 1,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
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
        flex: 1, borderRadius: 16, padding: 14, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    infoCardLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6, marginBottom: 4 },
    infoCardValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
    infoCardSub: { fontSize: 10 },
    mapCard: {
        borderRadius: 20, marginHorizontal: 16, marginTop: 12,
        padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 14 },
    mapWrapper: { height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
    shopMarker: { padding: 3, backgroundColor: 'white', borderRadius: 25, borderWidth: 2, borderColor: '#1877F2' },
    shopMarkerImage: { width: 40, height: 40, borderRadius: 20 },
    addressText: { fontSize: 13, lineHeight: 18 },
    timePickerCard: {
        borderRadius: 20, marginHorizontal: 16, marginTop: 12,
        padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    timeDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
    timeChip: { backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', minWidth: 72 },
    timeChipLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    timeChipValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
    timeArrow: { paddingHorizontal: 2 },
    aboutCard: {
        borderRadius: 20, marginHorizontal: 16, marginTop: 12,
        padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    aboutText: { fontSize: 14, lineHeight: 22 },
    stickyBottom: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16, paddingVertical: 14,
        borderTopWidth: 1,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 12,
    },
    stickyPriceInfo: { flex: 1 },
    stickyPriceLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
    stickyPrice: { fontSize: 24, fontWeight: '800' },
    stickyPriceDuration: { fontSize: 11 },
    bookBtnWrapper: { flex: 2, borderRadius: 16, overflow: 'hidden', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
    bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
    bookBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
    
    // Grid & Slot Styles
    dateChip: {
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', minWidth: 60,
    },
    dateChipSelected: {},
    dateChipDayName: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    dateChipDayNum: { fontSize: 16, fontWeight: '800' },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    slotChip: {
        flexBasis: '30%', paddingVertical: 12, borderRadius: 10, backgroundColor: '#E0F2FE', alignItems: 'center', borderWidth: 1, borderColor: '#BAE6FD'
    },
    slotChipBooked: { backgroundColor: '#FEE2E2', borderColor: '#FECACA', opacity: 0.6 },
    slotChipSelected: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
    slotChipText: { fontSize: 13, fontWeight: '700', color: '#0369A1' },
    slotChipTextBooked: { color: '#EF4444', textDecorationLine: 'line-through' },
    slotChipTextSelected: { color: 'white' },
});

