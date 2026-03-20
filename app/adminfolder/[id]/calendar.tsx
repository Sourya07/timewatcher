import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { getAdminShopBookings } from '@/constants/adminApi';
import { useThemeStore } from '@/Store/themeStore';

type Booking = {
    id: number;
    startTime: string;
    endTime: string;
    duration: number;
    price: number;
    status: string;
    service: { name: string };
    user: { name: string; email: string };
};

export default function AdminShopCalendar() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useThemeStore();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchBookings = async () => {
            if (!id) return;
            try {
                const data = await getAdminShopBookings(Number(id));
                setBookings(data);
            } catch (error) {
                console.error("Failed to load shop bookings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [id]);

    // Format dates for react-native-calendars
    const markedDates = useMemo(() => {
        const marks: any = {};
        
        bookings.forEach(b => {
            if (b.status === 'cancelled') return;
            const dateStr = b.startTime.split('T')[0];
            marks[dateStr] = {
                marked: true,
                dotColor: colors.primary,
            };
        });

        // Always highlight the selected date
        marks[selectedDate] = {
            ...marks[selectedDate],
            selected: true,
            selectedColor: colors.primary,
        };

        return marks;
    }, [bookings, selectedDate, colors.primary]);

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Filter bookings for the selected date
    const dayBookings = useMemo(() => {
        return bookings.filter(b => 
            b.status !== 'cancelled' && 
            b.startTime.startsWith(selectedDate)
        ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [bookings, selectedDate]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Booking Calendar</Text>
                <View style={{ width: 40 }} /> {/* spacer */}
            </View>

            <Calendar
                current={selectedDate}
                onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                markedDates={markedDates}
                theme={{
                    backgroundColor: colors.background,
                    calendarBackground: colors.surface,
                    textSectionTitleColor: colors.textMuted,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.primary,
                    dayTextColor: colors.text,
                    textDisabledColor: colors.textMuted + '50',
                    dotColor: colors.primary,
                    selectedDotColor: '#ffffff',
                    arrowColor: colors.primary,
                    monthTextColor: colors.text,
                    indicatorColor: colors.primary,
                    textDayFontWeight: '500',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '600',
                }}
                style={styles.calendar}
            />

            <View style={styles.agendaContainer}>
                <Text style={[styles.agendaTitle, { color: colors.text }]}>
                    Schedule for {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {dayBookings.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-clear-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No bookings for this date.</Text>
                        </View>
                    ) : (
                        dayBookings.map((booking) => (
                            <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={styles.timeSection}>
                                    <Text style={[styles.timeText, { color: colors.text }]}>{formatTime(booking.startTime)}</Text>
                                    <View style={[styles.durationBadge, { backgroundColor: colors.primary + '15' }]}>
                                        <Text style={[styles.durationText, { color: colors.primary }]}>{booking.duration}m</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.detailsSection}>
                                    <Text style={[styles.serviceName, { color: colors.text }]}>{booking.service.name}</Text>
                                    <View style={styles.userRow}>
                                        <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                                        <Text style={[styles.userName, { color: colors.textMuted }]}>{booking.user.name}</Text>
                                    </View>
                                    
                                    <View style={styles.statusRow}>
                                        <View style={[styles.statusBadge, { 
                                            backgroundColor: booking.status === 'completed' ? '#10B98115' : '#3B82F615' 
                                        }]}>
                                            <Text style={[styles.statusText, { 
                                                color: booking.status === 'completed' ? '#10B981' : '#3B82F6' 
                                            }]}>
                                                {booking.status.toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={[styles.priceText, { color: colors.text }]}>₹{booking.price}</Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 16, 
        paddingVertical: 12 
    },
    backBtn: {
        width: 40, height: 40,
        justifyContent: 'center', alignItems: 'center'
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    calendar: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        paddingBottom: 10
    },
    agendaContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    agendaTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 40
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '500'
    },
    bookingCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2
    },
    timeSection: {
        width: 80,
        borderRightWidth: 1,
        borderRightColor: 'rgba(0,0,0,0.05)',
        marginRight: 16,
        alignItems: 'flex-start'
    },
    timeText: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 6
    },
    durationBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    durationText: {
        fontSize: 11,
        fontWeight: '600'
    },
    detailsSection: {
        flex: 1
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12
    },
    userName: {
        fontSize: 14,
        fontWeight: '500'
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    priceText: {
        fontSize: 15,
        fontWeight: '700'
    }
});
