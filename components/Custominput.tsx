import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '@/Store/themeStore';

interface CustomInputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    label: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
    multiline?: boolean;
    editable?: boolean;
}

const Custominput = ({
    placeholder,
    value,
    onChangeText,
    label,
    secureTextEntry,
    keyboardType,
    rightIcon,
    containerStyle,
    multiline,
    editable = true,
}: CustomInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const { colors } = useThemeStore();

    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
            <View
                style={[
                    styles.inputWrapper,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                    },
                    isFocused && {
                        borderColor: colors.primary,
                        backgroundColor: colors.background,
                        shadowColor: colors.primary,
                    },
                ]}
            >
                <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    style={[
                        styles.input,
                        { color: colors.text },
                        multiline && { height: 80, textAlignVertical: 'top' },
                    ]}
                    multiline={multiline}
                    editable={editable}
                />
                {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 4,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    inputWrapperFocused: {
        borderColor: '#FE8C00',
        backgroundColor: '#FFFBF5',
        shadowColor: '#FE8C00',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    rightIcon: {
        marginLeft: 8,
    },
});

export default Custominput;