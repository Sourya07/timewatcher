import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import Custominput from '@/components/Custominput';
import CustomButton from '@/components/Custombutton';
import { useState } from 'react';
import apiClient from '@/constants/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/Store/themeStore';

const Signup = () => {
    const { colors } = useThemeStore();
    const [isSubmitting, setSubmitting] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });

    const submit = async () => {
        if (!form.name || !form.email || !form.password) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.post('/api/v1/admin/signup', form);
            Alert.alert('Success', 'Account created! Sign in now.');
            router.replace('/adminsign-in');
        } catch (error: any) {
            Alert.alert('Signup failed', error?.response?.data?.error || error?.response?.data?.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View>
            <Text style={[styles.title, { color: colors.text }]}>Become a Seller 🚀</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Create your seller account</Text>

            <View style={styles.form}>
                <Custominput
                    placeholder="Your full name"
                    value={form.name}
                    onChangeText={(text) => setForm({ ...form, name: text })}
                    label="Full Name"
                    keyboardType="default"
                />
                <View style={{ marginTop: 20 }}>
                    <Custominput
                        placeholder="seller@example.com"
                        value={form.email}
                        onChangeText={(text) => setForm({ ...form, email: text })}
                        label="Email"
                        keyboardType="email-address"
                    />
                </View>
                <View style={{ marginTop: 20 }}>
                    <Custominput
                        placeholder="Create a strong password"
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
                        title={isSubmitting ? 'Creating account…' : 'Create Seller Account'}
                        onPress={submit}
                        isLoading={isSubmitting}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textMuted }]}>Already a seller? </Text>
                <Link href="/adminsign-in" style={[styles.footerLink, { color: colors.primary }]}>
                    Sign In
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

export default Signup;