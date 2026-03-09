import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList, Image, Pressable, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Fragment, useEffect } from "react";
import { router } from "expo-router";
import { useShopStore } from '@/Store/shopstore';
import { images, offers } from "@/constants";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import cn from 'clsx';

export default function Index() {
    const { shops, fetchShops, loading } = useShopStore();

    useEffect(() => {
        if (shops.length === 0) fetchShops();
    }, [shops.length]);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
                        <View>
                            <Text style={styles.greeting}>Good day 👋</Text>
                            <Text style={styles.appName}>TimeExchange</Text>
                            <Text style={styles.subtitle}>Book the services you need</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.sellerBtn}
                            onPress={() => router.replace('/(authadmin)/adminsign-in')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="storefront-outline" size={14} color="#FE8C00" />
                            <Text style={styles.sellerBtnText}>Become a Seller</Text>
                        </TouchableOpacity>

                        <Text style={styles.sectionTitle}>Browse Categories</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
    listContent: { paddingBottom: 80, paddingHorizontal: 20 },
    header: { marginTop: 8, marginBottom: 20 },
    greeting: { fontSize: 14, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
    appName: { fontSize: 32, fontWeight: '800', color: '#111827', letterSpacing: -1 },
    subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 20 },
    sellerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFF7ED',
        borderColor: '#FED7AA',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignSelf: 'flex-start',
        marginBottom: 28,
    },
    sellerBtnText: { color: '#FE8C00', fontSize: 13, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
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
