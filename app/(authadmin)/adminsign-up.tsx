import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import Custominput from '@/components/Custominput';
import CustomButton from '@/components/Custombutton';
import { useState } from 'react';
import apiClient from '@/constants/axiosInstance';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/Store/themeStore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import BackButton from '@/components/BackButton';

WebBrowser.maybeCompleteAuthSession();

const Signup = () => {
    const { colors } = useThemeStore();
    const [isSubmitting, setSubmitting] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

    useEffect(() => {
        AppleAuthentication.isAvailableAsync().then(setIsAppleAuthAvailable);
    }, []);

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'your_web_client_id.apps.googleusercontent.com', 
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'your_ios_client_id.apps.googleusercontent.com',
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'your_android_client_id.apps.googleusercontent.com',
        redirectUri: makeRedirectUri({
            scheme: 'myapp',
        }),
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.idToken) {
                handleGoogleLogin(authentication.idToken);
            }
        }
    }, [response]);

    const handleGoogleLogin = async (idToken: string) => {
        setSubmitting(true);
        try {
            const res = await apiClient.post('/api/v1/admin/google', { idToken });
            await SecureStore.deleteItemAsync('token');
            await SecureStore.setItemAsync('admintoken', res.data.token);
            router.replace('/adminfolder' as any);
        } catch (error: any) {
            Alert.alert('Google Sign-In Failed', error.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAppleLogin = async () => {
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });
            setSubmitting(true);
            const name = credential.fullName?.givenName 
                ? `${credential.fullName.givenName} ${credential.fullName.familyName || ''}`.trim() 
                : undefined;
            const res = await apiClient.post('/api/v1/admin/apple', { idToken: credential.identityToken, name });
            await SecureStore.deleteItemAsync('token');
            await SecureStore.setItemAsync('admintoken', res.data.token);
            router.replace('/adminfolder' as any);
        } catch (e: any) {
            if (e.code !== 'ERR_REQUEST_CANCELED') {
                Alert.alert('Apple Sign-In Failed', e.message || 'Something went wrong');
            }
        } finally {
            setSubmitting(false);
        }
    };

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
            <BackButton style={{ alignSelf: 'flex-start', marginBottom: 16 }} backgroundColor={colors.surface} />
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

            <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            <View style={{ marginTop: 24, gap: 12 }}>
                <TouchableOpacity
                    style={[styles.socialBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => promptAsync()}
                    disabled={!request || isSubmitting}
                >
                    <Ionicons name="logo-google" size={20} color={colors.text} />
                    <Text style={[styles.socialBtnText, { color: colors.text }]}>Continue with Google</Text>
                </TouchableOpacity>

                {/* @ts-ignore - expo-apple-authentication type definition issue */}
                {isAppleAuthAvailable && (
                    <AppleAuthentication.AppleAuthenticationButton
                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                        buttonStyle={colors.background === '#18191A' 
                            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE 
                            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                        cornerRadius={14}
                        style={styles.appleBtn}
                        onPress={handleAppleLogin}
                    />
                )}
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
    socialBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 12, paddingVertical: 14, borderRadius: 14, borderWidth: 1
    },
    socialBtnText: { fontSize: 15, fontWeight: '600' },
    appleBtn: { width: '100%', height: 48 },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 36 },
    footerText: { fontSize: 14 },
    footerLink: { fontSize: 14, fontWeight: '700' },
});

export default Signup;