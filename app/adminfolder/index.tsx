import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, Image, ActivityIndicator,
    Alert, TouchableOpacity, StyleSheet
} from 'react-native';
import { router } from 'expo-router';
import apiClient from '@/constants/axiosInstance';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';

type AdminShop = {
    image: string;
    address: string;
    mobilenumber: string;
    occupation: string;
    speclization: string;
    timein: string;
    timeout: string;
    price: number;
};

export default function AdminShopsScreen() {
    const [shops, setShops] = useState<AdminShop[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchShops = async () => {
        try {
            const token = await SecureStore.getItemAsync('admintoken');
            if (!token) { 
                router.replace('/(authadmin)/adminsign-in'); 
                return; 
            }
            const res = await apiClient.get('/api/v1/admin/adminshops', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setShops(res.data.shops);
        } catch {
            Alert.alert('Error', 'Failed to load shops');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchShops(); }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#FE8C00" />
                <Text style={styles.loadingText}>Loading your listings…</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn} activeOpacity={0.8}>
                        <Ionicons name="home-outline" size={20} color="#1F2937" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.headerTitle}>My Listings</Text>
                        <Text style={styles.headerSub}>{shops.length} active {shops.length === 1 ? 'shop' : 'shops'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => router.push('/adminprofile')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add" size={22} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: '#EF4444', shadowColor: '#EF4444' }]}
                            onPress={async () => {
                                // Clear both the current and the legacy token key
                                await SecureStore.deleteItemAsync('admintoken');
                                await SecureStore.deleteItemAsync('token');   // legacy key cleanup
                                router.replace('/');
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="log-out-outline" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {shops.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🏪</Text>
                        <Text style={styles.emptyTitle}>No listings yet</Text>
                        <Text style={styles.emptySub}>Create your first shop to start accepting bookings</Text>
                        <TouchableOpacity
                            style={styles.createBtn}
                            onPress={() => router.push('/adminprofile')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#FF8C00', '#FF5F00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGradient}>
                                <Text style={styles.createBtnText}>Create a Listing</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    shops.map((shop, index) => (
                        <View key={index} style={styles.shopCard}>
                            {shop.image ? (
                                <Image source={{ uri: shop.image }} style={styles.shopImage} resizeMode="cover" />
                            ) : (
                                <View style={styles.shopImagePlaceholder}>
                                    <Text style={styles.shopImagePlaceholderIcon}>🏬</Text>
                                </View>
                            )}

                            {/* Price badge */}
                            <View style={styles.priceBadge}>
                                <Text style={styles.priceBadgeText}>₹{shop.price}/min</Text>
                            </View>

                            <View style={styles.shopBody}>
                                <Text style={styles.shopOccupation}>{shop.occupation}</Text>
                                <Text style={styles.shopSpecialization}>{shop.speclization}</Text>

                                <View style={styles.shopRow}>
                                    <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                                    <Text style={styles.shopMeta} numberOfLines={1}>{shop.address || 'No address'}</Text>
                                </View>
                                <View style={styles.shopRow}>
                                    <Ionicons name="call-outline" size={14} color="#9CA3AF" />
                                    <Text style={styles.shopMeta}>{shop.mobilenumber || '—'}</Text>
                                </View>

                                <View style={styles.timingRow}>
                                    <Ionicons name="time-outline" size={14} color="#FE8C00" />
                                    <Text style={styles.timingText}>{shop.timein} – {shop.timeout}</Text>
                                    <View style={styles.openBadge}>
                                        <Text style={styles.openBadgeText}>Open</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingBottom: 20 },
    backBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'white',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
    headerSub: { fontSize: 13, color: '#6B7280', marginTop: 1 },
    addBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF8C00',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#FF8C00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
    shopCard: {
        backgroundColor: 'white', borderRadius: 20, marginBottom: 16, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    shopImage: { width: '100%', height: 180 },
    shopImagePlaceholder: { width: '100%', height: 140, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    shopImagePlaceholderIcon: { fontSize: 48 },
    priceBadge: {
        position: 'absolute', top: 12, right: 12,
        backgroundColor: '#1F2937', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    priceBadgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
    shopBody: { padding: 16 },
    shopOccupation: { fontSize: 18, fontWeight: '800', color: '#111827' },
    shopSpecialization: { fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 12 },
    shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    shopMeta: { fontSize: 13, color: '#6B7280', flex: 1 },
    timingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    timingText: { fontSize: 13, color: '#374151', fontWeight: '600', flex: 1 },
    openBadge: { backgroundColor: '#D1FAE5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
    openBadgeText: { color: '#059669', fontSize: 11, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
    emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', maxWidth: 260, lineHeight: 22, marginBottom: 28 },
    createBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: '#FF8C00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
    createBtnGradient: { paddingVertical: 16, paddingHorizontal: 32 },
    createBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});