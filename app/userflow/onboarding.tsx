import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useThemeStore } from '@/Store/themeStore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Discover Services',
        description: 'Find the best professionals near you quickly and easily.',
        icon: 'search-outline',
    },
    {
        id: '2',
        title: 'Book Instantly',
        description: 'Check real-time availability and secure your appointment.',
        icon: 'calendar-outline',
    },
    {
        id: '3',
        title: 'Manage Time',
        description: 'Never miss an appointment with automated reminders.',
        icon: 'time-outline',
    }
];

export default function OnboardingScreen() {
    const { colors } = useThemeStore();
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // End of onboarding, go to Main App (Auth or Home)
            router.replace('/(authuser)/sign-in'); // Or your root destination
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.slideContainer}>
                <View style={styles.iconContainer}>
                    <Ionicons 
                        name={SLIDES[currentIndex].icon as any} 
                        size={80} 
                        color={colors.primary} 
                    />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>
                    {SLIDES[currentIndex].title}
                </Text>
                <Text style={[styles.description, { color: colors.textMuted }]}>
                    {SLIDES[currentIndex].description}
                </Text>
            </View>

            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index.toString()}
                            style={[
                                styles.dot,
                                { backgroundColor: currentIndex === index ? colors.primary : colors.border },
                                currentIndex === index && { width: 24 }
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    slideContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 32,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    button: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    }
});
