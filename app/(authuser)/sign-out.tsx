import { View, Text, Button, Alert } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const signOut = () => {
    const handleSignOut = async () => {
        try {
            // Remove the stored token
            await SecureStore.deleteItemAsync('usertoken');

            Alert.alert('Signed Out', 'You have been logged out successfully.');

            // Redirect to sign-in screen
            router.replace('/sign-in');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };

    return (
        <View>
            <Text>Sign Out</Text>
            <Button title="Sign Out" onPress={handleSignOut} />
        </View>
    );
};

export default signOut;