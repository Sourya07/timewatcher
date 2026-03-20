import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardAnalytics, getServiceAnalytics } from '@/constants/analyticsApi';
import { useThemeStore } from '@/Store/themeStore';

type DashboardStats = {
    totalBookings: number;
    totalRevenue: number;
    totalCustomers: number;
    averageRating: number;
    recentBookings: { date: string; count: number }[];
};

type ServiceStat = {
    serviceId: number;
    serviceName: string;
    bookingCount: number;
    totalRevenue: number;
};

export default function AdminDashboardScreen() {
    const { colors } = useThemeStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [serviceStats, setServiceStats] = useState<ServiceStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [dashboardData, servicesData] = await Promise.all([
                    getDashboardAnalytics(),
                    getServiceAnalytics()
                ]);
                setStats(dashboardData);
                setServiceStats(servicesData);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    const maxBookingsInTrend = Math.max(...(stats?.recentBookings.map(b => b.count) || [1]));

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Dashboard</Text>
                <Text style={{ color: colors.textMuted }}>Your business at a glance</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                
                {/* ─── Highlights Grid ─── */}
                <View style={styles.grid}>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="wallet-outline" size={24} color={colors.primary} />
                        </View>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Total Revenue</Text>
                        <Text style={[styles.cardValue, { color: colors.text }]}>₹{stats?.totalRevenue.toLocaleString()}</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.iconWrap, { backgroundColor: '#10B98115' }]}>
                            <Ionicons name="calendar-outline" size={24} color="#10B981" />
                        </View>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Total Bookings</Text>
                        <Text style={[styles.cardValue, { color: colors.text }]}>{stats?.totalBookings}</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.iconWrap, { backgroundColor: '#8B5CF615' }]}>
                            <Ionicons name="people-outline" size={24} color="#8B5CF6" />
                        </View>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Unique Customers</Text>
                        <Text style={[styles.cardValue, { color: colors.text }]}>{stats?.totalCustomers}</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.iconWrap, { backgroundColor: '#F59E0B15' }]}>
                            <Ionicons name="star-outline" size={24} color="#F59E0B" />
                        </View>
                        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Average Rating</Text>
                        <Text style={[styles.cardValue, { color: colors.text }]}>{stats?.averageRating} / 5</Text>
                    </View>
                </View>

                {/* ─── Recent Bookings Trend (7 Days) ─── */}
                <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Booking Trend (Last 7 Days)</Text>
                    
                    <View style={styles.chartArea}>
                        {stats?.recentBookings.map((day, idx) => {
                            const barHeight = Math.max(10, (day.count / (maxBookingsInTrend || 1)) * 120);
                            const dayName = new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' });
                            
                            return (
                                <View key={idx} style={styles.barWrap}>
                                    <Text style={[styles.barValue, { color: colors.textMuted }]}>{day.count}</Text>
                                    <View style={[styles.bar, { height: barHeight, backgroundColor: colors.primary }]} />
                                    <Text style={[styles.dayLabel, { color: colors.textMuted }]}>{dayName}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* ─── Top Services ─── */}
                <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 40 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Performing Services</Text>
                    
                    {serviceStats.length === 0 ? (
                        <Text style={{ color: colors.textMuted, padding: 20, textAlign: 'center' }}>No service data available yet.</Text>
                    ) : (
                        serviceStats.map((service, index) => (
                            <View key={service.serviceId} style={styles.serviceRow}>
                                <View style={styles.serviceLeft}>
                                    <Text style={[styles.serviceRank, { color: colors.textMuted }]}>#{index + 1}</Text>
                                    <View>
                                        <Text style={[styles.serviceName, { color: colors.text }]}>{service.serviceName}</Text>
                                        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{service.bookingCount} bookings</Text>
                                    </View>
                                </View>
                                <Text style={[styles.serviceRevenue, { color: colors.text }]}>₹{service.totalRevenue.toLocaleString()}</Text>
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
    headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
    card: { 
        width: '47.5%', 
        padding: 16, 
        borderRadius: 20, 
        borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
    },
    iconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    cardLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
    cardValue: { fontSize: 22, fontWeight: '800' },

    section: { 
        padding: 20, 
        borderRadius: 24, 
        borderWidth: 1,
        marginBottom: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
    
    chartArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingTop: 20 },
    barWrap: { alignItems: 'center', flex: 1 },
    barValue: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
    bar: { width: 14, borderRadius: 7 },
    dayLabel: { fontSize: 11, fontWeight: '500', marginTop: 8 },

    serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    serviceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    serviceRank: { fontSize: 16, fontWeight: '800', width: 24 },
    serviceName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    serviceRevenue: { fontSize: 16, fontWeight: '700' },
});
