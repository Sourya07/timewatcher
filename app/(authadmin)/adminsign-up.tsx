import { View, Text, Alert } from 'react-native'
import { Link, router } from 'expo-router'
import Custominput from '@/components/Custominput'
import CustomButton from '@/components/Custombutton'
import { useState } from 'react'
import axios from 'axios'

const Signup = () => {
    const [isSubmitting, setSubmitting] = useState(false)

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: ''
    })

    const submit = async () => {
        if (!form.name || !form.email || !form.password) {
            Alert.alert('Error', 'Please fill all fields')
            return
        }

        setSubmitting(true)

        try {
            const response = await axios.post('https://timewatcher.onrender.com/api/v1/admin/signup', form)

            Alert.alert('Success', 'User signed up successfully')
            router.replace('/adminsign-in')
        } catch (error: any) {
            console.log('Signup error:', error)
            Alert.alert('Signup failed', error?.response?.data?.message || 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <View className="gap-10 bg-white rounded p-5 mt-5">
            <Text>Admin dashboard</Text>
            <Custominput
                placeholder="Enter your name"
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                label="Name"
                keyboardType="default"
            />
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
                title={isSubmitting ? 'Signing up...' : 'Sign Up'}
                onPress={submit}
                isLoading={isSubmitting}
            />

            <View className="flex justify-center mt-5 flex-row gap-2">
                <Text className="base-regular text-gray-100">
                    Already have an account?
                </Text>
                <Link href="/sign-in" className="base-bold text-primary">
                    Sign In
                </Link>
            </View>
        </View>
    )
}

export default Signup