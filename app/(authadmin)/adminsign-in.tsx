import { View, Text, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import Custominput from '@/components/Custominput';
import CustomButton from '@/components/Custombutton';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const Signin = () => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    // ✅ Check token on mount
    useEffect(() => {
        const checkToken = async () => {
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                // Redirect if already signed in
                router.replace('/adminprofile');
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
            const response = await axios.post('https://timewatcher.onrender.com/api/v1/admin/signin', {
                email: form.email,
                password: form.password,
            });

            const { token } = response.data;

            Alert.alert('Success', 'Signed in successfully');

            await SecureStore.setItemAsync('token', token);

            router.replace('/adminprofile'); // ✅ Use replace so back button won't go back to signin

        } catch (error: any) {
            console.error('Sign in error:', error);
            const message = error.response?.data?.error || error.message || 'Something went wrong';
            Alert.alert('Sign in Failed', message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View className="gap-10 bg-white rounded p-5 mt-5">
            <Text>Admin dashboard</Text>
            <Custominput
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                label="Email"
                keyboardType="email-address"
            />

            <Custominput
                placeholder="Enter your password"
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
                label="Password"
                keyboardType="default"
                secureTextEntry={true}
            />

            <CustomButton
                title={isSubmitting ? 'Signing in...' : 'Sign In'}
                onPress={submit}
                isLoading={isSubmitting}
            />

            <View className="flex justify-center mt-5 flex-row gap-2">
                <Text className="base-regular text-gray-100">Don't have an account?</Text>
                <Link href="/adminsign-up" className="base-bold text-primary">
                    Sign Up
                </Link>
            </View>
        </View>
    );
};

export default Signin;