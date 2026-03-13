import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useShopStore } from '@/Store/shopstore';
import { useThemeStore } from '@/Store/themeStore';
import BackButton from '@/components/BackButton';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function InteractiveMapScreen() {
    const router = useRouter();
    const { colors } = useThemeStore();
    const { shops, fetchShops } = useShopStore();

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLoading(false);
                return;
            }

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            if (shops.length === 0) {
                await fetchShops();
            }

            setLoading(false);
        })();
    }, []);

    const initialRegion = location
        ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
          }
        : {
              latitude: 37.78825, // default fallback
              longitude: -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
          };

    const handleCenterMap = () => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 1000);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <BackButton fallbackRoute="/(tabs)" style={{ width: 40, height: 40 }} backgroundColor={colors.background} iconColor={colors.text} />
                <Text style={[styles.headerTitle, { color: colors.text }]}>Discover Shops</Text>
                <View style={styles.headerRight} />
            </View>

            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                showsUserLocation={true}
                showsMyLocationButton={false}
                mapType="standard" // or "mutedStandard"
            >
                {shops.filter(s => s.latitude && s.longitude).map((shop) => (
                    <Marker
                        key={shop.id}
                        coordinate={{
                            latitude: Number(shop.latitude),
                            longitude: Number(shop.longitude),
                        }}
                        onCalloutPress={() => router.push(`/Shopbyname/${shop.id}` as any)}
                    >
                        <View style={[styles.markerBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="storefront" size={14} color="white" />
                        </View>
                        <Callout tooltip>
                            <View style={[styles.calloutContainer, { backgroundColor: colors.surface }]}>
                                {shop.image && (
                                    <Image
                                        source={{ uri: shop.image.startsWith('http') ? shop.image : `data:image/jpeg;base64,${shop.image}` }}
                                        style={styles.calloutImage}
                                        resizeMode="cover"
                                    />
                                )}
                                <View style={styles.calloutTextContainer}>
                                    <Text style={[styles.calloutTitle, { color: colors.text }]} numberOfLines={1}>{shop.occupation}</Text>
                                    {shop.category?.name && (
                                        <Text style={styles.calloutCategory}>{shop.category.name}</Text>
                                    )}
                                    <Text style={styles.calloutAddress} numberOfLines={2}>{shop.address}</Text>
                                </View>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            <TouchableOpacity
                style={[styles.floatingButton, { backgroundColor: colors.surface }]}
                onPress={handleCenterMap}
                activeOpacity={0.8}
            >
                <Ionicons name="navigate" size={24} color={colors.primary} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        minHeight: 60,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerRight: {
        width: 40,
    },
    map: {
        width: width,
        height: height - 60,
    },
    markerBadge: {
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    calloutContainer: {
        width: 200,
        borderRadius: 12,
        overflow: 'hidden',
        padding: 0,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    calloutImage: {
        width: '100%',
        height: 80,
    },
    calloutTextContainer: {
        padding: 10,
    },
    calloutTitle: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    calloutCategory: {
        fontSize: 12,
        color: '#6366f1',
        fontWeight: '600',
        marginBottom: 4,
    },
    calloutAddress: {
        fontSize: 11,
        color: '#6b7280',
    },
    floatingButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 6,
    },
});
