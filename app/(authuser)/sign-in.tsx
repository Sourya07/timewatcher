import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import Custominput from '@/components/Custominput';
import CustomButton from '@/components/Custombutton';
import { useState } from 'react';
import { userSignin } from '@/constants/userApi';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/Store/themeStore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import { userAppleSignin, userGoogleSignin } from '@/constants/userApi';
import { useEffect } from 'react';

WebBrowser.maybeCompleteAuthSession();

const UserSignInScreen = () => {
    const { colors } = useThemeStore();
    const [isSubmitting, setSubmitting] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });
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
            await userGoogleSignin(idToken);
            router.replace('/userflow/setting');
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
            await userAppleSignin(credential.identityToken!, name);
            router.replace('/userflow/setting');
        } catch (e: any) {
            if (e.code !== 'ERR_REQUEST_CANCELED') {
                Alert.alert('Apple Sign-In Failed', e.message || 'Something went wrong');
            }
        } finally {
            setSubmitting(false);
        }
    };

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
            router.replace('/userflow/setting');
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

export default UserSignInScreen;