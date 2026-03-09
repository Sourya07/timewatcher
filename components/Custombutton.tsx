import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/Store/themeStore';

interface CustomButtonProps {
    onPress?: () => void;
    title?: string;
    style?: object;
    leftIcon?: React.ReactNode;
    textStyle?: object;
    isLoading?: boolean;
    variant?: 'primary' | 'outline' | 'ghost';
}

const CustomButton = ({
    onPress,
    title = 'Click Me',
    style,
    textStyle,
    leftIcon,
    isLoading = false,
    variant = 'primary',
}: CustomButtonProps) => {
    const { colors } = useThemeStore();
    if (variant === 'outline') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={[styles.outlineBtn, style]}
                disabled={isLoading}
            >
                {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
                {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Text style={[styles.outlineBtnText, { color: colors.primary }, textStyle]}>{title}</Text>
                )}
            </TouchableOpacity>
        );
    }

    if (variant === 'ghost') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[styles.ghostBtn, style]}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                    <Text style={[styles.ghostBtnText, { color: colors.primary }, textStyle]}>{title}</Text>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={[styles.wrapper, style]}
            disabled={isLoading}
        >
            <LinearGradient
                colors={
                    isLoading
                        ? [colors.primary, colors.headerGradientEnd]
                        : [colors.primary, colors.headerGradientEnd]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
                <View style={styles.content}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={[styles.btnText, textStyle]}>{title}</Text>
                    )}
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#1877F2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    gradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    outlineBtn: {
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#1877F2',
        paddingVertical: 15,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    outlineBtnText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    ghostBtn: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ghostBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
});

export default CustomButton;