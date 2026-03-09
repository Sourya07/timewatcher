import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, Image, ActivityIndicator,
    Alert, TouchableOpacity, StyleSheet, Switch
} from 'react-native';
import { router } from 'expo-router';
import apiClient from '@/constants/axiosInstance';
import { updateAdminShopSettings } from '@/constants/adminApi';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useThemeStore } from '@/Store/themeStore';

type AdminShop = {
    image: string;
    address: string;
    mobilenumber: string;
    occupation: string;
    speclization: string;
    timein: string;
    timeout: string;
    price: number;
    isOpen: boolean;
    slotDuration: number;
    id: number;
};

export default function AdminShopsScreen() {
    const [shops, setShops] = useState<AdminShop[]>([]);
    const [loading, setLoading] = useState(true);
    const { colors } = useThemeStore();

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

    const toggleShopStatus = async (shopId: number, currentStatus: boolean) => {
        try {
            // Optimistically update UI
            setShops(prev => prev.map(s => s.id === shopId ? { ...s, isOpen: !currentStatus } : s));
            await updateAdminShopSettings(shopId, { isOpen: !currentStatus });
        } catch (error) {
            Alert.alert("Error", "Failed to update shop status");
            // Revert on failure
            setShops(prev => prev.map(s => s.id === shopId ? { ...s, isOpen: currentStatus } : s));
        }
    };

    useEffect(() => { fetchShops(); }, []);

    if (loading) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading your listings…</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.replace('/')} style={[styles.backBtn, { backgroundColor: colors.surface }]} activeOpacity={0.8}>
                        <Ionicons name="home-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>My Listings</Text>
                        <Text style={[styles.headerSub, { color: colors.textMuted }]}>{shops.length} active {shops.length === 1 ? 'shop' : 'shops'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
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
                        <Text style={styles.emptyIcon}>🏦</Text>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>No listings yet</Text>
                        <Text style={[styles.emptySub, { color: colors.textMuted }]}>Create your first shop to start accepting bookings</Text>
                        <TouchableOpacity
                            style={[styles.createBtn, { shadowColor: colors.primary }]}
                            onPress={() => router.push('/adminprofile')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={[colors.primary, colors.headerGradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtnGradient}>
                                <Text style={styles.createBtnText}>Create a Listing</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>                ) : (
                    shops.map((shop, index) => (
                        <View key={index} style={[styles.shopCard, { backgroundColor: colors.surface }]}>
                            {shop.image ? (
                                <Image source={{ uri: shop.image }} style={styles.shopImage} resizeMode="cover" />
                            ) : (
                                <View style={[styles.shopImagePlaceholder, { backgroundColor: colors.background }]}>
                                    <Text style={styles.shopImagePlaceholderIcon}>🏢</Text>
                                </View>
                            )}

                            {/* Price badge */}
                            <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
                                <Text style={styles.priceBadgeText}>₹{shop.price} / {shop.slotDuration}m</Text>
                            </View>

                            <View style={styles.shopBody}>
                                <Text style={[styles.shopOccupation, { color: colors.text }]}>{shop.occupation}</Text>
                                <Text style={[styles.shopSpecialization, { color: colors.textMuted }]}>{shop.speclization}</Text>

                                <View style={styles.shopRow}>
                                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                                    <Text style={[styles.shopMeta, { color: colors.textMuted }]} numberOfLines={1}>
                                        {shop.address || 'No address'}
                                    </Text>
                                </View>

                                <View style={styles.shopRow}>
                                    <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                                    <Text style={[styles.shopMeta, { color: colors.textMuted }]}>
                                        {shop.mobilenumber || '—'}
                                    </Text>
                                </View>

                                <View style={styles.timingRow}>
                                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.timingText, { color: colors.text }]}>
                                            {shop.timein} – {shop.timeout}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                                            {shop.slotDuration} min sessions
                                        </Text>
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            fontWeight: '600',
                                            color: shop.isOpen ? '#059669' : '#DC2626',
                                        }}
                                    >
                                        {shop.isOpen ? 'Accepting Bookings' : 'Closed'}
                                    </Text>
                                    <Switch
                                        value={shop.isOpen}
                                        onValueChange={() => toggleShopStatus(shop.id, shop.isOpen)}
                                        trackColor={{ false: '#FECACA', true: '#D1FAE5' }}
                                        thumbColor={shop.isOpen ? '#10B981' : '#EF4444'}
                                    />
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
    safeArea: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, paddingBottom: 20 },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    },
    headerTitle: { fontSize: 22, fontWeight: '800' },
    headerSub: { fontSize: 13, marginTop: 1 },
    addBtn: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
    shopCard: {
        borderRadius: 20, marginBottom: 16, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    },
    shopImage: { width: '100%', height: 180 },
    shopImagePlaceholder: { width: '100%', height: 140, alignItems: 'center', justifyContent: 'center' },
    shopImagePlaceholderIcon: { fontSize: 48 },
    priceBadge: {
        position: 'absolute', top: 12, right: 12,
        borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    priceBadgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
    shopBody: { padding: 16 },
    shopOccupation: { fontSize: 18, fontWeight: '800' },
    shopSpecialization: { fontSize: 13, marginTop: 2, marginBottom: 12 },
    shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    shopMeta: { fontSize: 13, flex: 1 },
    timingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    timingText: { fontSize: 13, fontWeight: '600', flex: 1 },
    openBadge: { backgroundColor: '#D1FAE5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
    openBadgeText: { color: '#059669', fontSize: 11, fontWeight: '700' },
    emptyState: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
    emptySub: { fontSize: 14, textAlign: 'center', maxWidth: 260, lineHeight: 22, marginBottom: 28 },
    createBtn: { borderRadius: 16, overflow: 'hidden', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
    createBtnGradient: { paddingVertical: 16, paddingHorizontal: 32 },
    createBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});