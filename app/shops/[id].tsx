import { View, Text, Image, ScrollView, ActivityIndicator, Pressable, Alert, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useShopStore, ShopService } from '@/Store/shopstore';
import { useState, useEffect, useCallback } from 'react';
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getShopSlots, createBooking } from '@/constants/bookingApi';
import { useThemeStore } from '@/Store/themeStore';
import BackButton from '@/components/BackButton';
import apiClient from '@/constants/axiosInstance';

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
                <BackButton style={{ marginTop: 20 }} fallbackRoute="/(tabs)" backgroundColor={colors.primary} iconColor="white" />
            </SafeAreaView>
        );
    }

    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [slots, setSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [selectedService, setSelectedService] = useState<ShopService | null>(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const [isFavorite, setIsFavorite] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [averageRating, setAverageRating] = useState(0);
    const [isEligibleToReview, setIsEligibleToReview] = useState(false);

    const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    useEffect(() => {
        if (!shop) return;
        const fetchShopData = async () => {
            try {
                const reviewsRes = await apiClient.get(`/api/v1/user/reviews/${shop.id}`);
                setReviews(reviewsRes.data.reviews || []);
                setAverageRating(reviewsRes.data.averageRating || 0);

                const favsRes = await apiClient.get('/api/v1/user/favorites');
                const favs = favsRes.data || [];
                setIsFavorite(favs.some((f: any) => f.shopId === shop.id));

                try {
                    const eligRes = await apiClient.get(`/api/v1/user/reviews/eligibility/${shop.id}`);
                    setIsEligibleToReview(eligRes.data.eligible);
                } catch (e) {
                    console.log("Eligibility check failed", e);
                }
            } catch (err) {
                console.log("Failed to fetch shop data:", err);
            }
        };
        fetchShopData();
    }, [shop?.id]);

    const handleToggleFavorite = async () => {
        setIsFavorite(!isFavorite); 
        try {
            await apiClient.post('/api/v1/user/favorites', { shopId: shop.id });
        } catch (error) {
            setIsFavorite(!isFavorite); 
            console.error("Failed to toggle favorite", error);
        }
    };

    const submitReview = async () => {
        if (reviewRating === 0) {
            Alert.alert("Rating Required", "Please select a star rating.");
            return;
        }
        if (!reviewComment.trim()) {
            Alert.alert("Comment Required", "Please write a short review.");
            return;
        }
        setIsSubmittingReview(true);
        try {
            await apiClient.post('/api/v1/user/reviews', {
                shopId: shop.id,
                rating: reviewRating,
                comment: reviewComment
            });
            Alert.alert("Success", "Your review has been submitted!");
            setIsReviewModalVisible(false);
            setReviewRating(0);
            setReviewComment("");
            const reviewsRes = await apiClient.get(`/api/v1/user/reviews/${shop.id}`);
            setReviews(reviewsRes.data.reviews || []);
            setAverageRating(reviewsRes.data.averageRating || 0);
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.error || "Failed to submit review.");
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Auto-select first service if available
    useEffect(() => {
        if (shop?.services && shop.services.length > 0 && !selectedService) {
            setSelectedService(shop.services[0]);
        }
    }, [shop]);

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
        if (!selectedService) return;
        try {
            const res = await getShopSlots(Number(id), dateStr, selectedService.id);
            setSlots(res.slots || []);
        } catch (error) {
            console.error("Failed to fetch slots", error);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const shopPrice = selectedService ? Number(selectedService.price) : 0;
    const durationMins = selectedService?.durationMins ? Number(selectedService.durationMins) : 30;
    const totalPrice = shopPrice; // now treated as price per slot directly

    const handleBooking = async () => {
        if (!selectedService) {
            Alert.alert("No Service Selected", "Please select a service before booking.");
            return;
        }
        if (!selectedSlot) {
            Alert.alert("Invalid Duration", "Please select an available time slot.");
            return;
        }

        try {
            await createBooking({
                shopServiceId: selectedService.id,
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
                <BackButton style={{ marginRight: 12, width: 38, height: 38 }} backgroundColor={colors.background} />
                <View style={styles.locationInfo}>
                    <Ionicons name="location-sharp" size={14} color={colors.primary} />
                    <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                        {shop.address ? shop.address.split(" ").slice(0, 4).join(" ") : "Location"}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteBtn}>
                    <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={26} color={isFavorite ? "#EF4444" : colors.text} />
                </TouchableOpacity>
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
                        <Text style={[styles.infoCardLabel, { color: colors.textMuted }]}>Starting</Text>
                        <Text style={[styles.infoCardValue, { color: colors.text }]}>₹{shop.services?.[0]?.price || 0}</Text>
                        <Text style={styles.infoCardSub}>minimum</Text>
                    </View>
                </View>

                {/* Map */}
                {(shop.latitude && shop.longitude) ? (
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
                ) : (
                    <View style={[styles.mapCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>📍 Location</Text>
                        <Text style={[styles.addressText, { color: colors.textMuted, marginBottom: 8 }]}>{shop.address || "No address provided."}</Text>
                        <View style={[styles.mapWrapper, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }]}>
                            <Ionicons name="map-outline" size={48} color={colors.textMuted} />
                            <Text style={{ color: colors.textMuted, marginTop: 8 }}>Map not available for this shop</Text>
                        </View>
                    </View>
                )}

                {/* Services Menu */}
                {shop.services && shop.services.length > 0 && (
                    <View style={[styles.servicesCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>📋 Select a Service</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
                            {shop.services.map((svc) => {
                                const isSelected = selectedService?.id === svc.id;
                                return (
                                    <TouchableOpacity
                                        key={svc.id}
                                        onPress={() => setSelectedService(svc)}
                                        style={[
                                            styles.serviceChip,
                                            { backgroundColor: isSelected ? colors.primary + '15' : colors.background },
                                            isSelected && { borderColor: colors.primary }
                                        ]}
                                    >
                                        <View style={styles.serviceIconWrapper}>
                                            <Ionicons name="checkmark-circle" size={18} color={isSelected ? colors.primary : 'transparent'} />
                                        </View>
                                        <Text style={[styles.serviceChipName, { color: colors.text }]}>{svc.name}</Text>
                                        <Text style={[styles.serviceChipPrice, { color: colors.primary }]}>₹{svc.price}</Text>
                                        {svc.durationMins && (
                                            <Text style={[styles.serviceChipMeta, { color: colors.textMuted }]}>{svc.durationMins} mins</Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

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

                {/* Reviews Section */}
                <View style={[styles.aboutCard, { backgroundColor: colors.surface, marginTop: 12 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>⭐ Reviews ({reviews.length})</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="star" size={16} color="#F59E0B" />
                                <Text style={{ fontWeight: '700', color: colors.text }}>{averageRating.toFixed(1)}</Text>
                            </View>
                            {isEligibleToReview && (
                                <TouchableOpacity onPress={() => setIsReviewModalVisible(true)} style={[styles.reviewBtn, { backgroundColor: colors.primary + '15' }]}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>Write Review</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                    {reviews.slice(0, 3).map((rev, i) => (
                        <View key={i} style={{ borderBottomWidth: i < reviews.length - 1 && i < 2 ? 1 : 0, borderBottomColor: colors.border, paddingBottom: 12, marginBottom: i < 2 ? 12 : 0 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <Text style={{ fontWeight: '600', color: colors.text }}>{rev.user?.name || 'User'}</Text>
                                <View style={{ flexDirection: 'row' }}>
                                    {[...Array(5)].map((_, idx) => (
                                        <Ionicons key={idx} name={idx < rev.rating ? "star" : "star-outline"} size={12} color="#F59E0B" />
                                    ))}
                                </View>
                            </View>
                            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{rev.comment}</Text>
                        </View>
                    ))}
                    {reviews.length === 0 && (
                        <Text style={{ color: colors.textMuted, fontSize: 13, fontStyle: 'italic' }}>No reviews yet. Be the first to book and review!</Text>
                    )}
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

            {/* Review Modal */}
            <Modal
                transparent
                visible={isReviewModalVisible}
                animationType="fade"
                onRequestClose={() => setIsReviewModalVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Rate & Review</Text>
                        
                        <View style={styles.starContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                                    <Ionicons name={star <= reviewRating ? "star" : "star-outline"} size={40} color="#F59E0B" />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={{ textAlign: 'center', color: colors.textMuted, marginBottom: 16 }}>Tap a star to rate</Text>

                        <TextInput
                            style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Share your experience..."
                            placeholderTextColor={colors.textMuted}
                            value={reviewComment}
                            onChangeText={setReviewComment}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setIsReviewModalVisible(false)} style={[styles.modalCancelBtn, { borderColor: colors.border }]} disabled={isSubmittingReview}>
                                <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={submitReview} style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]} disabled={isSubmittingReview}>
                                {isSubmittingReview ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Submit Review</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    favoriteBtn: {
        width: 38, height: 38, borderRadius: 19,
        alignItems: 'center', justifyContent: 'center', marginLeft: 12,
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
    servicesCard: {
        borderRadius: 20, marginHorizontal: 16, marginTop: 12, paddingLeft: 16, paddingTop: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    serviceChip: {
        padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'transparent', minWidth: 120,
        backgroundColor: '#F3F4F6', alignItems: 'flex-start'
    },
    serviceIconWrapper: { position: 'absolute', top: 8, right: 8 },
    serviceChipName: { fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: 6 },
    serviceChipPrice: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
    serviceChipMeta: { fontSize: 11, fontWeight: '500' },
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
    
    // Review Modal Styles
    reviewBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', borderRadius: 24, padding: 24, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
    modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
    starContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
    modalInput: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 15, height: 120, marginBottom: 24 },
    modalActions: { flexDirection: 'row', gap: 12 },
    modalCancelBtn: { flex: 1, borderWidth: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalCancelText: { fontWeight: '700', fontSize: 15 },
    modalSubmitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalSubmitText: { color: 'white', fontWeight: '700', fontSize: 15 },
});

