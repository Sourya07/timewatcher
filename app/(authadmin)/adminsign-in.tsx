import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import Custominput from '@/components/Custominput';
import CustomButton from '@/components/Custombutton';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '@/constants/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/Store/themeStore';

const Signin = () => {
    const { colors } = useThemeStore();
    const [isSubmitting, setSubmitting] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });

    useEffect(() => {
        const checkToken = async () => {
            const token = await SecureStore.getItemAsync('admintoken');
            if (!token) return; // No token → stay on sign-in

            // Validate the token is still live (admin still exists in DB)
            try {
                await apiClient.get('/api/v1/admin/me');
                // Token is valid → go to dashboard
                router.replace('/adminfolder/');
            } catch {
                // Token is stale (admin deleted, expired, etc.) → clear it
                await SecureStore.deleteItemAsync('admintoken');
                await SecureStore.deleteItemAsync('token'); // legacy cleanup
            }
        };
        checkToken();
    }, []);

    const submit = async () => {
        if (!form.email || !form.password) {
            Alert.alert('Validation Error', 'Please fill all the fields');
            return;
        }
        setSubmitting(true);
        try {
            const response = await apiClient.post('/api/v1/admin/signin', form);
            const { token } = response.data;
            // Clear any legacy 'token' key that may still contain a stale admin token
            await SecureStore.deleteItemAsync('token');
            await SecureStore.setItemAsync('admintoken', token);
            router.replace('/adminfolder/');
        } catch (error: any) {
            const message = error.response?.data?.error || error.message || 'Something went wrong';
            Alert.alert('Sign in Failed', message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View>
            <Text style={[styles.title, { color: colors.text }]}>Seller Sign In 🔑</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Access your dashboard</Text>

            <View style={styles.form}>
                <Custominput
                    placeholder="seller@example.com"
                    value={form.email}
                    onChangeText={(text) => setForm({ ...form, email: text })}
                    label="Email"
                    keyboardType="email-address"
                />
                <View style={{ marginTop: 20 }}>
                    <Custominput
                        placeholder="••••••••"
                        value={form.password}
                        onChangeText={(text) => setForm({ ...form, password: text })}
                        label="Password"
                        secureTextEntry={!showPass}
                        rightIcon={
                            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        }
                    />
                </View>

                <View style={{ marginTop: 32 }}>
                    <CustomButton
                        title={isSubmitting ? 'Signing in…' : 'Sign In to Dashboard'}
                        onPress={submit}
                        isLoading={isSubmitting}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textMuted }]}>New seller? </Text>
                <Link href="/adminsign-up" style={[styles.footerLink, { color: colors.primary }]}>
                    Create Account
                </Link>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { fontSize: 15, marginTop: 6, marginBottom: 32 },
    form: {},
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 36 },
    footerText: { fontSize: 14 },
    footerLink: { fontSize: 14, fontWeight: '700' },
});

export default Signin;