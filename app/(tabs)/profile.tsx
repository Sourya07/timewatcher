import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    Pressable,
    Image,
    ActivityIndicator,
    Animated,
    StyleSheet,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import apiClient from "@/constants/axiosInstance";
import type { ReactNode } from "react";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const HEADER_MAX_HEIGHT = SCREEN_HEIGHT / 3.5;
const HEADER_MIN_HEIGHT = 100;

interface UserData {
    id: number;
    name: string;
    email: string;
    mobilenumber: string;
    profile?: { address?: string; mobilenumber?: string; image?: string };
}

type QuickActionProps = { icon: ReactNode; label: string; onPress?: () => void };
function QuickAction({ icon, label, onPress }: QuickActionProps) {
    return (
        <Pressable onPress={onPress} style={styles.quickAction}>
            <View style={styles.quickActionIcon}>{icon}</View>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </Pressable>
    );
}

type ListItemProps = { icon: ReactNode; label: string; badge?: string; onPress?: () => void };
function ListItem({ icon, label, badge, onPress }: ListItemProps) {
    return (
        <Pressable onPress={onPress} style={styles.listItem}>
            <View style={styles.listItemLeft}>
                <View style={styles.listItemIcon}>{icon}</View>
                <Text style={styles.listItemLabel}>{label}</Text>
            </View>
            <View style={styles.listItemRight}>
                {badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
                <Feather name="chevron-right" size={18} color="#D1D5DB" />
            </View>
        </Pressable>
    );
}

export default function ProfileScreen() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<UserData>();
    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = await SecureStore.getItemAsync("usertoken");
                if (!token) { router.replace("/(authuser)/sign-in"); return; }
                const res = await apiClient.get<UserData>("/api/v1/user/");
                setUserData(res.data);
            } catch (error) {
                console.log("Error fetching profile:", error);
                router.replace("/(authuser)/sign-in");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await SecureStore.deleteItemAsync("usertoken");
            await SecureStore.deleteItemAsync("admintoken");
            router.replace("/(authuser)/sign-in");
        } catch (error) {
            console.log("Logout error:", error);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FE8C00" />
                <Text style={styles.loadingText}>Loading profile…</Text>
            </SafeAreaView>
        );
    }
    if (!userData) return null;

    const headerHeight = scrollY.interpolate({
        inputRange: [-100, 0, HEADER_MAX_HEIGHT],
        outputRange: [HEADER_MAX_HEIGHT + 100, HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        extrapolate: "clamp",
    });
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, HEADER_MAX_HEIGHT * 0.6, HEADER_MAX_HEIGHT],
        outputRange: [1, 0.7, 0],
        extrapolate: "clamp",
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Scrollable content */}
            <Animated.ScrollView
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT + 16 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    {/* Membership Card */}
                    <LinearGradient colors={['#1a1a1a', '#333']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.memberCard}>
                        <View style={styles.memberCardInner}>
                            <View>
                                <Text style={styles.memberCardTitle}>Minutesmen Member</Text>
                                <Text style={styles.memberCardSub}>Minutesman · Explore exclusive benefits</Text>
                            </View>
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>ACTIVE</Text>
                            </View>
                        </View>
                        <View style={styles.memberCardCircle} />
                    </LinearGradient>

                    {/* Quick Actions */}
                    <View style={styles.quickActionsRow}>
                        <QuickAction
                            icon={<Ionicons name="location-outline" size={20} color="#FE8C00" />}
                            label="Address"
                            onPress={() => router.push({ pathname: "../userflow/savedaddress", params: { address: userData.profile?.address || "" } })}
                        />
                        <QuickAction icon={<Ionicons name="card-outline" size={20} color="#6366F1" />} label="Payment" />
                        <QuickAction icon={<MaterialIcons name="chat-bubble-outline" size={20} color="#10B981" />} label="Refunds" />
                        <QuickAction icon={<Ionicons name="wallet-outline" size={20} color="#F59E0B" />} label="Wallet" />
                    </View>

                    {/* Menu Section */}
                    <View style={styles.menuCard}>
                        <Text style={styles.menuSection}>Finance</Text>
                        <ListItem icon={<MaterialIcons name="credit-card" size={18} color="#6366F1" />} label="Your Cards" />
                        <View style={styles.divider} />
                        <ListItem icon={<Feather name="gift" size={18} color="#EC4899" />} label="My Vouchers" badge="3" />
                        <View style={styles.divider} />
                        <ListItem icon={<Feather name="file-text" size={18} color="#3B82F6" />} label="Account Statement" />
                    </View>

                    <View style={[styles.menuCard, { marginTop: 12 }]}>
                        <Text style={styles.menuSection}>Rewards & Perks</Text>
                        <ListItem icon={<Feather name="briefcase" size={18} color="#8B5CF6" />} label="Corporate Rewards" />
                        <View style={styles.divider} />
                        <ListItem icon={<Feather name="book-open" size={18} color="#0EA5E9" />} label="Student Rewards" />
                        <View style={styles.divider} />
                        <ListItem icon={<Feather name="award" size={18} color="#F59E0B" />} label="Partner Rewards" />
                    </View>

                    <View style={[styles.menuCard, { marginTop: 12 }]}>
                        <Text style={styles.menuSection}>My Activity</Text>
                        <ListItem 
                            icon={<Feather name="bookmark" size={18} color="#14B8A6" />} 
                            label="My Bookings" 
                            onPress={() => router.push('/(tabs)/cart')}
                        />
                        <View style={styles.divider} />
                        <ListItem icon={<Feather name="heart" size={18} color="#EF4444" />} label="Favourites" />
                    </View>

                    <TouchableOpacity 
                        style={styles.logoutBtn} 
                        activeOpacity={0.8}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </View>
            </Animated.ScrollView>

            {/* Animated Sticky Header */}
            <Animated.View style={[styles.header, { height: headerHeight }]}>
                <LinearGradient
                    colors={["#FF8C00", "#FF5F00"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                {/* Decorative circle */}
                <View style={styles.headerCircle} />

                <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
                    <View style={styles.headerTop}>
                        <Pressable onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={22} color="white" />
                        </Pressable>
                        <Pressable style={styles.helpBtn}>
                            <Text style={styles.helpText}>Help</Text>
                        </Pressable>
                    </View>

                    <View style={styles.headerUser}>
                        <View>
                            <Text style={styles.headerName}>{userData.name}</Text>
                            <Text style={styles.headerEmail}>{userData.email}</Text>
                            {userData.mobilenumber ? <Text style={styles.headerMobile}>{userData.mobilenumber}</Text> : null}
                        </View>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: userData.profile?.image || "https://ui-avatars.com/api/?name=" + encodeURIComponent(userData.name) + "&background=FF8C00&color=fff&size=150" }}
                                style={styles.avatar}
                            />
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' },
    loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
    header: {
        position: 'absolute', top: 0, left: 0, right: 0,
        overflow: 'hidden', zIndex: 1000,
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    },
    headerCircle: {
        position: 'absolute', width: 200, height: 200, borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -30,
    },
    headerContent: { flex: 1, paddingHorizontal: 20, paddingBottom: 24, justifyContent: 'flex-end' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    helpBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
    helpText: { color: 'white', fontSize: 13, fontWeight: '600' },
    headerUser: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    headerName: { color: 'white', fontSize: 24, fontWeight: '800' },
    headerEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
    headerMobile: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
    avatarWrapper: {
        width: 60, height: 60, borderRadius: 30,
        borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.8)',
        overflow: 'hidden', shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
    },
    avatar: { width: '100%', height: '100%' },
    content: { paddingHorizontal: 16 },
    memberCard: {
        borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
    },
    memberCardInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    memberCardTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
    memberCardSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4, maxWidth: 200 },
    memberCardCircle: {
        position: 'absolute', width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.05)', right: -20, bottom: -30,
    },
    activeBadge: { backgroundColor: '#22C55E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    activeBadgeText: { color: 'white', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    quickActionsRow: { flexDirection: 'row', marginBottom: 16 },
    quickAction: {
        flex: 1, backgroundColor: 'white', borderRadius: 16, paddingVertical: 16,
        alignItems: 'center', marginHorizontal: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    quickActionIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    quickActionLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textAlign: 'center' },
    menuCard: {
        backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    menuSection: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
    listItemLeft: { flexDirection: 'row', alignItems: 'center' },
    listItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    listItemLabel: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
    listItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    badge: { backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { color: '#D97706', fontSize: 11, fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#F3F4F6' },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        marginTop: 20, paddingVertical: 16, backgroundColor: '#FEF2F2',
        borderRadius: 16, borderWidth: 1, borderColor: '#FECACA',
    },
    logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});