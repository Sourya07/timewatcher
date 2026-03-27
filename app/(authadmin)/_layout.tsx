import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import { Redirect, Slot, router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/Store/themeStore';

const { height } = Dimensions.get('screen');

export default function AuthLayout() {
    const { colors } = useThemeStore();
    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/");
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                style={{ flex: 1, backgroundColor: colors.background }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Gradient Header */}
                <LinearGradient
                    colors={[colors.headerGradientStart, colors.headerGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, { height: height * 0.35 }]}
                >
                    {/* Back Button */}
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={20} color="white" />
                    </TouchableOpacity>

                    {/* Decorative circles */}
                    <View style={styles.circle1} />
                    <View style={styles.circle2} />

                    {/* Brand */}
                    <View style={styles.brand}>
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>SELLER PORTAL</Text>
                        </View>
                        <Text style={styles.brandName}>⚡ TimeWatcher</Text>
                        <Text style={styles.brandTagline}>Manage your appointments</Text>
                    </View>
                </LinearGradient>

                {/* Card */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <Slot />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        justifyContent: 'flex-end',
        paddingBottom: 40,
        paddingHorizontal: 24,
        overflow: 'hidden',
    },
    backBtn: {
        position: 'absolute',
        top: 52,
        left: 20,
        zIndex: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 50,
        padding: 10,
    },
    circle1: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(255,255,255,0.04)',
        top: -60,
        right: -50,
    },
    circle2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.03)',
        bottom: 20,
        right: 40,
    },
    brand: {
        alignItems: 'flex-start',
    },
    adminBadge: {
        backgroundColor: 'rgba(99,179,237,0.2)',
        borderColor: 'rgba(99,179,237,0.4)',
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 10,
    },
    adminBadgeText: {
        color: '#90CDF4',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    brandName: {
        color: 'white',
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    brandTagline: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 14,
        marginTop: 4,
        letterSpacing: 0.2,
    },
    card: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -24,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 60,
        minHeight: height * 0.7,
    },
});