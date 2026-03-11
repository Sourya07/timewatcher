import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "@/components/BackButton";
import { useThemeStore } from "@/Store/themeStore";
import { getAddresses, setDefaultAddress } from "@/constants/userApi";

interface Address {
    id: number;
    tag: string;
    flatNo?: string;
    address: string;
    pincode?: string;
    mobileNo?: string;
    isDefault: boolean;
}

export default function SavedAddress() {
    const { colors } = useThemeStore();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchAddresses = async () => {
        try {
            const data = await getAddresses();
            setAddresses(data);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not fetch saved addresses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleSetDefault = async (id: number) => {
        setUpdatingId(id);
        try {
            await setDefaultAddress(id);
            // Refresh to show the new default
            await fetchAddresses();
        } catch (error) {
            Alert.alert("Error", "Failed to set default address.");
        } finally {
            setUpdatingId(null);
        }
    };

    const getIconForTag = (tag: string) => {
        if (tag === 'Home') return 'home-outline';
        if (tag === 'Work') return 'briefcase-outline';
        return 'location-outline';
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <BackButton />
                <Text style={[styles.headerTitle, { color: colors.text }]}>Address Book</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.listContainer}>
                    {addresses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="map-outline" size={64} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.text }]}>No addresses saved yet</Text>
                            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Add an address to speed up your booking experience.</Text>
                        </View>
                    ) : (
                        addresses.map((addr) => (
                            <TouchableOpacity
                                key={addr.id}
                                style={[
                                    styles.addressCard,
                                    { backgroundColor: colors.surface, borderColor: addr.isDefault ? colors.primary : colors.border },
                                    addr.isDefault && styles.addressCardActive
                                ]}
                                onPress={() => handleSetDefault(addr.id)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: addr.isDefault ? colors.primary + '1A' : colors.background }]}>
                                    <Ionicons name={getIconForTag(addr.tag)} size={24} color={addr.isDefault ? colors.primary : colors.textMuted} />
                                </View>
                                <View style={styles.cardContent}>
                                    <View style={styles.titleRow}>
                                        <Text style={[styles.tagText, { color: colors.text }]}>{addr.tag}</Text>
                                        {addr.isDefault && (
                                            <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                                                <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.addressText, { color: colors.textMuted }]} numberOfLines={2}>
                                        {addr.flatNo ? `${addr.flatNo}, ` : ''}{addr.address}{addr.pincode ? ` - ${addr.pincode}` : ''}
                                    </Text>
                                    {addr.mobileNo && (
                                        <Text style={[styles.addressText, { color: colors.textMuted, marginTop: 4 }]}>
                                            Phone: {addr.mobileNo}
                                        </Text>
                                    )}
                                </View>
                                {updatingId === addr.id ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <Ionicons 
                                        name={addr.isDefault ? "radio-button-on" : "radio-button-off"} 
                                        size={24} 
                                        color={addr.isDefault ? colors.primary : colors.border} 
                                    />
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Bottom Add Button */}
            <View style={[styles.bottomContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/userflow/setting')}
                >
                    <Ionicons name="add" size={24} color="white" />
                    <Text style={styles.addBtnText}>Add New Address</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: "700" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    listContainer: { padding: 16, paddingBottom: 100 },
    emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
    emptyText: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    addressCardActive: {
        borderWidth: 1.5,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardContent: { flex: 1, marginRight: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    tagText: { fontSize: 16, fontWeight: '700', marginRight: 8 },
    addressText: { fontSize: 13, lineHeight: 18 },
    activeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    activeBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    addBtnText: { color: 'white', fontSize: 16, fontWeight: '700' }
});