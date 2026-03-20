import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Animated, Platform, TextInput, Alert, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyBookings, cancelBooking } from '@/constants/bookingApi';
import { useThemeStore } from '@/Store/themeStore';

const TABS = ['Active', 'Completed', 'Cancelled'];

export default function Cart() {
    const [activeTab, setActiveTab] = useState('Active');
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [searchQuery, setSearchQuery] = useState('');
    const [userBookings, setUserBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const { colors } = useThemeStore();

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const fetchBookings = async () => {
                setLoading(true);
                try {
                    const data = await getMyBookings();
                    if (isActive) setUserBookings(data || []);
                } catch (error) {
                    console.error("Failed to fetch bookings:", error);
                } finally {
                    if (isActive) setLoading(false);
                }
            };
            fetchBookings();
            return () => { isActive = false; };
        }, [])
    );

    // Animate tab indicator
    useEffect(() => {
        const index = TABS.indexOf(activeTab);
        Animated.spring(slideAnim, {
            toValue: index,
            useNativeDriver: true,
            damping: 15,
            stiffness: 150,
        }).start();
    }, [activeTab]);

    if (loading && userBookings.length === 0) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    const categorizeBooking = (booking: any) => {
        if (!booking.booked || booking.status === 'cancelled') return 'Cancelled';
        if (booking.status === 'completed') return 'Completed';
        return 'Active'; // 'upcoming' from backend
    };

    const handleCancel = (bookingId: number) => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking?",
            [
                { text: "No", style: "cancel" },
                { 
                    text: "Yes, Cancel", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await cancelBooking(bookingId);
                            const data = await getMyBookings();
                            setUserBookings(data || []);
                        } catch (error) {
                            Alert.alert("Error", "Failed to cancel booking. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const getFilteredOrders = () => {
        let baseOrders = userBookings.filter(b => categorizeBooking(b) === activeTab);

        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            return baseOrders.filter(order => {
                const shop = order.service?.shop || {};
                return (
                    (shop.Admin?.name && shop.Admin.name.toLowerCase().includes(lowerQuery)) ||
                    (shop.occupation && shop.occupation.toLowerCase().includes(lowerQuery)) ||
                    (shop.speclization && shop.speclization.toLowerCase().includes(lowerQuery)) ||
                    (order.service?.name && order.service.name.toLowerCase().includes(lowerQuery))
                );
            });
        }

        return baseOrders;
    };

    const currentOrders = getFilteredOrders();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
            
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
                <Text style={{ fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -1 }}>My Bookings</Text>
                <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>Manage your upcoming and past services</Text>
            </View>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    height: 48,
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.06)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                    elevation: 2,
                }}>
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search by provider or service..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{
                            flex: 1,
                            marginLeft: 12,
                            fontSize: 15,
                            color: colors.text,
                            height: '100%',
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#D1D5DB" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Custom Segmented Control Tab Bar */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: 'rgba(118, 118, 128, 0.08)',
                    borderRadius: 12,
                    padding: 4,
                    position: 'relative',
                }}>
                    <Animated.View style={{
                        position: 'absolute',
                        top: 4,
                        bottom: 4,
                        left: 4,
                        width: '33.33%',
                        backgroundColor: colors.surface,
                        borderRadius: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                        transform: [{
                            translateX: slideAnim.interpolate({
                                inputRange: [0, 1, 2],
                                outputRange: [0, 115, 230], // Approximate tab widths, would ideally be measured onLayout
                            })
                        }]
                    }} />
                    
                    {TABS.map((tab, idx) => (
                        <TouchableOpacity
                            key={tab}
                            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', zIndex: 1 }}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={{
                                fontSize: 14,
                                fontWeight: activeTab === tab ? '600' : '500',
                                color: activeTab === tab ? colors.text : colors.textMuted,
                            }}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Orders List */}
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {currentOrders.length === 0 ? (
                    // Empty State
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
                        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
                            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>No {activeTab} Bookings</Text>
                        <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 }}>
                            You don't have any {activeTab.toLowerCase()} service bookings at the moment.
                        </Text>
                        
                        {activeTab !== 'Active' && (
                            <TouchableOpacity
                                style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.primary, borderRadius: 24 }}
                                onPress={() => router.push('/(tabs)')}
                            >
                                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Book a Service</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    // Order Cards
                    currentOrders.map((order, idx) => (
                        <View
                            key={order.id || idx}
                            style={{
                                backgroundColor: colors.surface,
                                borderRadius: 20,
                                padding: 16,
                                marginBottom: 16,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.04,
                                shadowRadius: 10,
                                elevation: 4,
                                borderWidth: 1,
                                borderColor: colors.border
                            }}
                        >
                            {/* Card Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                                    <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>
                                        {new Date(order.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})} at {new Date(order.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                
                                <View style={{
                                    backgroundColor: activeTab === 'Active' ? 'rgba(24, 119, 242, 0.1)' : activeTab === 'Completed' ? 'rgba(49, 162, 76, 0.1)' : 'rgba(240, 40, 73, 0.1)',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                }}>
                                    <Text style={{
                                        fontSize: 11,
                                        fontWeight: '700',
                                        color: activeTab === 'Active' ? colors.primary : activeTab === 'Completed' ? colors.success : colors.danger,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5
                                    }}>
                                        {activeTab === 'Active' ? 'Upcoming' : activeTab === 'Completed' ? 'Completed' : 'Cancelled'}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16, opacity: 0.5 }} />

                            {/* Provider Info */}
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => router.push(`/shops/${order.service?.shop?.id}` as any)}
                                activeOpacity={0.7}
                            >
                                <Image
                                    source={{ uri: order.service?.shop?.image || 'https://via.placeholder.com/150' }}
                                    style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.background, borderWidth: 2, borderColor: colors.border }}
                                />
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 2 }}>{order.service?.shop?.Admin?.name || order.service?.shop?.occupation}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <MaterialIcons name="work" size={14} color={colors.textMuted} />
                                        <Text style={{ fontSize: 14, color: colors.textMuted }}>{order.service?.name || order.service?.shop?.speclization || order.service?.shop?.occupation}</Text>
                                    </View>
                                </View>
                                <View>
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>₹{order.price}</Text>
                                    <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'right', marginTop: 2 }}>{order.duration} min</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Action Buttons */}
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
                                    onPress={() => activeTab === 'Active' ? handleCancel(order.id) : setSelectedBooking(order)}
                                >
                                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                                        {activeTab === 'Active' ? 'Cancel' : 'E-Receipt'}
                                    </Text>
                                </TouchableOpacity>
                                
                                {activeTab === 'Active' && (
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', borderWidth: 1, borderColor: colors.primary }}
                                        onPress={() => router.push(`/shops/${order.service?.shop?.id}` as any)}
                                    >
                                        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                                            Reschedule
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: activeTab === 'Active' ? colors.primary : colors.text, alignItems: 'center' }}
                                    onPress={() => activeTab === 'Active' ? setSelectedBooking(order) : router.push(`/shops/${order.service?.shop?.id}` as any)}
                                >
                                    <Text style={{ color: colors.surface, fontWeight: '600', fontSize: 14 }}>
                                        {activeTab === 'Active' ? 'View Details' : 'Book Again'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    ))
                )}
            </ScrollView>

            {/* Receipt / View Details Modal */}
            <Modal
                visible={!!selectedBooking}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedBooking(null)}
            >
                {selectedBooking && (
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
                        <TouchableOpacity style={{ ...StyleSheet.absoluteFillObject }} activeOpacity={1} onPress={() => setSelectedBooking(null)} />
                        
                        <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 }}>
                            {/* Receipt Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ionicons name="receipt" size={20} color={colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Booking Details</Text>
                                        <Text style={{ fontSize: 12, color: colors.textMuted }}>ID: #{selectedBooking.id.toString().padStart(6, '0')}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setSelectedBooking(null)} style={{ padding: 6, backgroundColor: colors.background, borderRadius: 20 }}>
                                    <Ionicons name="close" size={20} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            
                            <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 20, opacity: 0.5 }} />
                            
                            {/* Date & Time Row */}
                            <View style={{ flexDirection: 'row', backgroundColor: colors.background, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
                                <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: colors.border }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 4 }}>Date</Text>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{new Date(selectedBooking.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</Text>
                                </View>
                                <View style={{ flex: 1, paddingLeft: 16 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: colors.textMuted, marginBottom: 4 }}>Time</Text>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{new Date(selectedBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </View>
                            </View>

                            {/* Service Details */}
                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Service Information</Text>
                            <View style={{ marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 14, color: colors.textMuted }}>Provider</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedBooking.service?.shop?.Admin?.name || selectedBooking.service?.shop?.occupation}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ fontSize: 14, color: colors.textMuted }}>Service</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedBooking.service?.name}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 14, color: colors.textMuted }}>Duration</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{selectedBooking.duration} mins</Text>
                                </View>
                            </View>

                            <View style={{ height: 1, backgroundColor: colors.border, borderStyle: 'dashed', borderWidth: 1, borderRadius: 1, marginBottom: 20, opacity: 0.3 }} />

                            {/* Payment Breakdown */}
                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Payment Summary</Text>
                            <View style={{ gap: 12, marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 14, color: colors.textMuted }}>Service Cost</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>₹{selectedBooking.price}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 14, color: colors.textMuted }}>Platform Fee (5%)</Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>₹{(selectedBooking.price * 0.05).toFixed(2)}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Total Paid</Text>
                                    <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>₹{(selectedBooking.price * 1.05).toFixed(2)}</Text>
                                </View>
                            </View>
                            
                            {/* CTA Action */}
                            <TouchableOpacity
                                style={{ width: '100%', paddingVertical: 14, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
                                onPress={() => {
                                    setSelectedBooking(null);
                                    router.push(`/shops/${selectedBooking.service?.shop?.id}` as any);
                                }}
                            >
                                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>View Provider Profile</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Modal>
        </SafeAreaView>
    );
}