import React from 'react';
import { TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/Store/themeStore';

interface BackButtonProps {
    fallbackRoute?: string;
    style?: any;
    iconColor?: string;
    backgroundColor?: string;
}

export default function BackButton({ 
    fallbackRoute = '/(tabs)', 
    style,
    iconColor,
    backgroundColor
}: BackButtonProps) {
    const router = useRouter();
    const { colors } = useThemeStore();

    const handlePress = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace(fallbackRoute as any);
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[
                styles.button,
                { backgroundColor: backgroundColor || (colors.surface === '#FFFFFF' ? '#F9FAFB' : '#1F2937') },
                style
            ]}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
        >
            <Ionicons 
                name="arrow-back" 
                size={20} 
                color={iconColor || colors.text} 
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        padding: 10,
        borderRadius: 9999, // full pill/circle
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
});
