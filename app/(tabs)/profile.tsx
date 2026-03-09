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
    NativeScrollEvent,
    TouchableOpacity,
    Switch
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import apiClient from "@/constants/axiosInstance";
import { useThemeStore } from "@/Store/themeStore";
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

type QuickActionProps = { icon: ReactNode; label: string; onPress?: () => void; colors: any };
function QuickAction({ icon, label, onPress, colors }: QuickActionProps) {
    return (
        <Pressable onPress={onPress} style={styles.quickAction}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.background }]}>{icon}</View>
            <Text style={[styles.quickActionLabel, { color: colors.text }]}>{label}</Text>
        </Pressable>
    );
}

type ListItemProps = { icon: ReactNode; label: string; badge?: string; onPress?: () => void; rightElement?: ReactNode; colors: any };
function ListItem({ icon, label, badge, onPress, rightElement, colors }: ListItemProps) {
    return (
        <Pressable onPress={onPress} style={styles.listItem}>
            <View style={styles.listItemLeft}>
                <View style={[styles.listItemIcon, { backgroundColor: colors.background }]}>{icon}</View>
                <Text style={[styles.listItemLabel, { color: colors.text }]}>{label}</Text>
            </View>
            <View style={styles.listItemRight}>
                {badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
                {rightElement ? rightElement : <Feather name="chevron-right" size={18} color={colors.textMuted} />}
            </View>
        </Pressable>
    );
}

export default function ProfileScreen() {
    const { isDarkMode, toggleTheme, colors } = useThemeStore();
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
            <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile…</Text>
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
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
                            icon={<Ionicons name="location-outline" size={20} color={colors.primary} />}
                            label="Address"
                            colors={colors}
                            onPress={() => router.push({ pathname: "../userflow/savedaddress", params: { address: userData.profile?.address || "" } })}
                        />
                        <QuickAction icon={<Ionicons name="card-outline" size={20} color="#6366F1" />} label="Payment" colors={colors} />
                        <QuickAction icon={<MaterialIcons name="chat-bubble-outline" size={20} color={colors.success} />} label="Refunds" colors={colors} />
                        <QuickAction icon={<Ionicons name="wallet-outline" size={20} color={colors.warning} />} label="Wallet" colors={colors} />
                    </View>

                    {/* App Settings */}
                    <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.menuSection, { color: colors.text }]}>App Settings</Text>
                        <ListItem 
                            icon={<Ionicons name={isDarkMode ? "moon" : "sunny"} size={18} color={isDarkMode ? "#A78BFA" : "#FBBF24"} />} 
                            label="Dark Theme" 
                            colors={colors}
                            rightElement={
                                <Switch 
                                    value={isDarkMode} 
                                    onValueChange={toggleTheme} 
                                    trackColor={{ false: "#D1D5DB", true: colors.primary }}
                                    thumbColor="white"
                                />
                            }
                        />
                    </View>

                    {/* Menu Section */}
                    <View style={[styles.menuCard, { marginTop: 12, backgroundColor: colors.surface }]}>
                        <Text style={[styles.menuSection, { color: colors.text }]}>Finance</Text>
                        <ListItem icon={<MaterialIcons name="credit-card" size={18} color="#6366F1" />} label="Your Cards" colors={colors} />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <ListItem icon={<Feather name="gift" size={18} color="#EC4899" />} label="My Vouchers" badge="3" colors={colors} />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <ListItem icon={<Feather name="file-text" size={18} color="#3B82F6" />} label="Account Statement" colors={colors} />
                    </View>

                    <View style={[styles.menuCard, { marginTop: 12, backgroundColor: colors.surface }]}>
                        <Text style={[styles.menuSection, { color: colors.text }]}>Rewards & Perks</Text>
                        <ListItem icon={<Feather name="briefcase" size={18} color="#8B5CF6" />} label="Corporate Rewards" colors={colors} />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <ListItem icon={<Feather name="book-open" size={18} color="#0EA5E9" />} label="Student Rewards" colors={colors} />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <ListItem icon={<Feather name="award" size={18} color="#F59E0B" />} label="Partner Rewards" colors={colors} />
                    </View>

                    <View style={[styles.menuCard, { marginTop: 12, backgroundColor: colors.surface }]}>
                        <Text style={[styles.menuSection, { color: colors.text }]}>My Activity</Text>
                        <ListItem 
                            icon={<Feather name="bookmark" size={18} color="#14B8A6" />} 
                            label="My Bookings" 
                            colors={colors}
                            onPress={() => router.push('/(tabs)/cart')}
                        />
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <ListItem icon={<Feather name="heart" size={18} color="#EF4444" />} label="Favourites" colors={colors} />
                    </View>

                    <TouchableOpacity 
                        style={[styles.logoutBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} 
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
                    colors={[colors.headerGradientStart, colors.headerGradientEnd]}
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
                                source={{
                                    uri:
                                        userData.profile?.image ||
                                        "https://ui-avatars.com/api/?name=" +
                                            encodeURIComponent(userData.name) +
                                            "&background=1877F2&color=fff&size=150",
                                }}
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
    safeArea: { flex: 1 },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 12, fontSize: 14 },
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
    headerName: { color: 'white', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    headerEmail: { color: 'white', fontSize: 13, opacity: 0.9, marginTop: 4 },
    headerMobile: { color: 'white', fontSize: 13, opacity: 0.9, marginTop: 2 },
    avatarWrapper: {
        padding: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 40,
    },
    avatar: { width: 68, height: 68, borderRadius: 34 },
    content: { paddingHorizontal: 16 },
    memberCard: {
        borderRadius: 20, padding: 20, marginTop: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
        overflow: 'hidden',
    },
    memberCardInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 },
    memberCardTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
    memberCardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
    activeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    activeBadgeText: { color: 'white', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    memberCardCircle: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', right: -20, top: -40, zIndex: 1 },
    quickActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 },
    quickAction: { alignItems: 'center', width: '25%' },
    quickActionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    quickActionLabel: { fontSize: 12, fontWeight: '600' },
    menuCard: {
        borderRadius: 20, padding: 20, paddingTop: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    menuSection: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    listItemLeft: { flexDirection: 'row', alignItems: 'center' },
    listItemIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    listItemLabel: { fontSize: 15, fontWeight: '600' },
    listItemRight: { flexDirection: 'row', alignItems: 'center' },
    badge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
    badgeText: { color: 'white', fontSize: 10, fontWeight: '700' },
    divider: { height: 1, width: '100%', marginVertical: 4 },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, borderRadius: 16, marginTop: 24,
        borderWidth: 1,
    },
    logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700', marginLeft: 8 },
});