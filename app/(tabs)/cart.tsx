import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Animated, Platform, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyBookings, cancelBooking } from '@/constants/bookingApi';

const TABS = ['Active', 'Completed', 'Cancelled'];

export default function Cart() {
    const [activeTab, setActiveTab] = useState('Active');
    const slideAnim = useRef(new Animated.Value(0)).current;
    const [searchQuery, setSearchQuery] = useState('');
    const [userBookings, setUserBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FB', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
            </SafeAreaView>
        );
    }

    const categorizeBooking = (booking: any) => {
        if (!booking.booked) return 'Cancelled';

        // Check if the booking date is today and end time has passed
        const now = new Date();
        const createdDate = new Date(booking.createdAt);
        
        if (createdDate.toDateString() !== now.toDateString()) {
            return 'Completed'; // Bookings from previous days are completed
        }
        
        // If it's today, check if end time passed
        try {
            const [time, modifier] = booking.endTime.trim().split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (modifier?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
            if (modifier?.toUpperCase() === 'AM' && hours === 12) hours = 0;
            
            const endTimeObj = new Date(now);
            endTimeObj.setHours(hours, minutes, 0, 0);
            
            return now <= endTimeObj ? 'Active' : 'Completed';
        } catch(e) {
            return 'Completed';
        }
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
            return baseOrders.filter(order => 
                (order.shop?.Admin?.name && order.shop.Admin.name.toLowerCase().includes(lowerQuery)) ||
                (order.shop?.occupation && order.shop.occupation.toLowerCase().includes(lowerQuery)) ||
                (order.shop?.speclization && order.shop.speclization.toLowerCase().includes(lowerQuery))
            );
        }

        return baseOrders;
    };

    const currentOrders = getFilteredOrders();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FB' }} edges={['top', 'left', 'right']}>
            
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
                <Text style={{ fontSize: 32, fontWeight: '800', color: '#111827', letterSpacing: -1 }}>My Bookings</Text>
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>Manage your upcoming and past services</Text>
            </View>

            {/* Search Bar */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
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
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{
                            flex: 1,
                            marginLeft: 12,
                            fontSize: 15,
                            color: '#111827',
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
                        backgroundColor: '#FFFFFF',
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
                                color: activeTab === tab ? '#111827' : '#8E8E93',
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
                        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F3F8', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                            <Ionicons name="receipt-outline" size={48} color="#A0ABBB" />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 }}>No {activeTab} Bookings</Text>
                        <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 }}>
                            You don't have any {activeTab.toLowerCase()} service bookings at the moment.
                        </Text>
                        
                        {activeTab !== 'Active' && (
                            <TouchableOpacity
                                style={{ marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#007AFF', borderRadius: 24 }}
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
                                backgroundColor: '#FFFFFF',
                                borderRadius: 20,
                                padding: 16,
                                marginBottom: 16,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.04,
                                shadowRadius: 10,
                                elevation: 4,
                                borderWidth: 1,
                                borderColor: 'rgba(0,0,0,0.03)'
                            }}
                        >
                            {/* Card Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                                        {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}, {order.startTime}
                                    </Text>
                                </View>
                                
                                <View style={{
                                    backgroundColor: activeTab === 'Active' ? '#EBF5FF' : activeTab === 'Completed' ? '#F0FDF4' : '#FEF2F2',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                }}>
                                    <Text style={{
                                        fontSize: 11,
                                        fontWeight: '700',
                                        color: activeTab === 'Active' ? '#007AFF' : activeTab === 'Completed' ? '#16A34A' : '#EF4444',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5
                                    }}>
                                        {activeTab === 'Active' ? 'Upcoming' : activeTab === 'Completed' ? 'Completed' : 'Cancelled'}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginBottom: 16 }} />

                            {/* Provider Info */}
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                                onPress={() => router.push(`/shops/${order.shopId}` as any)}
                                activeOpacity={0.7}
                            >
                                <Image
                                    source={{ uri: order.shop?.image || 'https://via.placeholder.com/150' }}
                                    style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#F9FAFB' }}
                                />
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 2 }}>{order.shop?.Admin?.name || order.shop?.occupation}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <MaterialIcons name="work" size={14} color="#8E8E93" />
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>{order.shop?.speclization || order.shop?.occupation}</Text>
                                    </View>
                                </View>
                                <View>
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>₹{order.price}</Text>
                                    <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 2 }}>{order.duration} min</Text>
                                </View>
                            </TouchableOpacity>

                            {/* Action Buttons */}
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' }}
                                    onPress={() => activeTab === 'Active' ? handleCancel(order.id) : null}
                                >
                                    <Text style={{ color: '#4B5563', fontWeight: '600', fontSize: 14 }}>
                                        {activeTab === 'Active' ? 'Cancel' : 'E-Receipt'}
                                    </Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: activeTab === 'Active' ? '#007AFF' : '#111827', alignItems: 'center' }}
                                    onPress={() => router.push(`/shops/${order.shopId}` as any)}
                                >
                                    <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                                        {activeTab === 'Active' ? 'View Details' : 'Book Again'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}