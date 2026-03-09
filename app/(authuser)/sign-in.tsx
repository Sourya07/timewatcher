import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import Custominput from '@/components/Custominput';
import CustomButton from '@/components/Custombutton';
import { useState } from 'react';
import { userSignin } from '@/constants/userApi';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/Store/themeStore';

const UserSignInScreen = () => {
    const { colors } = useThemeStore();
    const [isSubmitting, setSubmitting] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const submit = async () => {
        if (!form.email || !form.password) {
            Alert.alert('Validation Error', 'Please fill all the fields');
            return;
        }
        if (!isValidEmail(form.email)) {
            Alert.alert('Validation Error', 'Please enter a valid email address');
            return;
        }
        setSubmitting(true);
        try {
            await userSignin(form.email, form.password);
            router.push('../userflow/setting');
        } catch (error: any) {
            Alert.alert('Sign in Failed', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View>
            <Text style={[styles.title, { color: colors.text }]}>Welcome back 👋</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Sign in to continue</Text>

            <View style={styles.form}>
                <Custominput
                    placeholder="you@example.com"
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

                <TouchableOpacity style={styles.forgotBtn}>
                    <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
                </TouchableOpacity>

                <View style={{ marginTop: 28 }}>
                    <CustomButton
                        title={isSubmitting ? 'Signing in…' : 'Sign In'}
                        onPress={submit}
                        isLoading={isSubmitting}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textMuted }]}>Don't have an account? </Text>
                <Link href="./sign-up" style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Link>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { fontSize: 15, marginTop: 6, marginBottom: 32 },
    form: { gap: 0 },
    forgotBtn: { alignSelf: 'flex-end', marginTop: 12 },
    forgotText: { fontSize: 13, fontWeight: '600' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 36 },
    footerText: { fontSize: 14 },
    footerLink: { fontSize: 14, fontWeight: '700' },
});

export default UserSignInScreen;