import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, Image, Pressable, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Fragment, useEffect, useState } from "react";
import { router } from "expo-router";
import * as Location from 'expo-location';
import { useShopStore } from '@/Store/shopstore';
import { images, offers } from "@/constants";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/Store/themeStore';
import cn from 'clsx';

export default function Index() {
    const { shops, fetchShops, loading } = useShopStore();
    const { colors } = useThemeStore();

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [address, setAddress] = useState<string>('Fetching location...');

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setAddress('Location permission denied');
                return;
            }

            try {
                let loc = await Location.getCurrentPositionAsync({});
                setLocation(loc);

                let postalAddress = await Location.reverseGeocodeAsync({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude
                });

                if (postalAddress && postalAddress.length > 0) {
                    const addr = postalAddress[0];
                    const formattedAddress = [
                        addr.streetNumber,
                        addr.street,
                        addr.subregion,
                        addr.city,
                        addr.region,
                        addr.postalCode
                    ].filter(Boolean).join(', ');
                    setAddress(formattedAddress || 'Unknown location');
                } else {
                    setAddress('Location found');
                }
            } catch (error) {
                setAddress('Unable to fetch location');
            }
        })();
    }, []);

    useEffect(() => {
        if (shops.length === 0) fetchShops();
    }, [shops.length]);

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <FlatList
                data={offers}
                renderItem={({ item, index }) => {
                    const isEven = index % 2 === 0;
                    return (
                        <Pressable
                            style={[styles.card, { borderRadius: 28 }, isEven && { flexDirection: 'row-reverse' }]}
                            onPress={() => {
                                router.push(`/Shopbyname/${item.name}` as any);
                            }}
                            android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
                        >
                            {({ pressed }) => (
                                <Fragment>
                                    <LinearGradient
                                        colors={[item.color, `${item.color}CC`]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={[StyleSheet.absoluteFill, { borderRadius: 28 }]}
                                    />
                                    {/* Decorative circle */}
                                    <View style={styles.cardCircle} />
 
                                    <View style={styles.cardImageWrapper}>
                                        <Image source={item.image} style={styles.cardImage} resizeMode="contain" />
                                    </View>

                                    <View style={[styles.cardInfo, isEven ? { paddingLeft: 24 } : { paddingRight: 24 }]}>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <View style={styles.cardArrow}>
                                            <Ionicons name="arrow-forward" size={16} color="white" />
                                        </View>
                                    </View>
                                </Fragment>
                            )}
                        </Pressable>
                    );
                }}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={() => (
                    <View style={styles.header}>
                        <View style={styles.locationHeaderContainer}>
                            <View style={styles.locationLeft}>
                                <View style={styles.locationRow}>
                                    <Ionicons name="navigate" size={18} color={colors.primary} />
                                    <Text style={[styles.locationTitle, { color: colors.text }]}>Current Location</Text>
                                    <Ionicons name="chevron-down" size={16} color={colors.text} />
                                </View>
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {address}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/profile')}>
                                <Ionicons name="person-circle" size={42} color={colors.text || '#4B5563'} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.greetingContainer}>
                            <Text style={styles.greeting}>Good day 👋</Text>
                            <Text style={[styles.appName, { color: colors.text }]}>TimeExchange</Text>
                            <Text style={styles.subtitle}>Book the services you need</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.sellerBtn, { borderColor: colors.primary, backgroundColor: colors.surface }]}
                            onPress={() => router.replace('/(authadmin)/adminsign-in')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="storefront-outline" size={14} color={colors.primary} />
                            <Text style={[styles.sellerBtnText, { color: colors.primary }]}>Become a Seller</Text>
                        </TouchableOpacity>

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse Categories</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    listContent: { paddingBottom: 80, paddingHorizontal: 20 },
    header: { marginTop: 8, marginBottom: 20 },
    locationHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    locationLeft: { flex: 1, paddingRight: 16 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    locationTitle: { fontSize: 16, fontWeight: '700' },
    locationText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    greetingContainer: { marginBottom: 20 },
    greeting: { fontSize: 14, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
    appName: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20 },
    sellerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignSelf: 'flex-start',
        marginBottom: 28,
    },
    sellerBtnText: { fontSize: 13, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
    card: {
        width: '100%',
        height: 160,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 10,
    },
    cardCircle: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.08)',
        top: -50,
        right: -40,
    },
    cardImageWrapper: {
        width: '45%',
        height: '100%',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardInfo: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        gap: 12,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: 'white',
        letterSpacing: -0.5,
        lineHeight: 28,
    },
    cardArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
