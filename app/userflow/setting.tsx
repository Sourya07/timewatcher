import React from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function SettingsScreen() {

    const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout", style: "destructive", onPress: async () => {
                    await SecureStore.deleteItemAsync("usertoken");
                    router.replace("/(authuser)/sign-in");
                }
            }
        ]);
    };

    const MenuItem = ({ icon, label, onPress }: { icon: React.ReactNode, label: string, onPress: () => void }) => (
        <Pressable onPress={onPress} className="flex-row items-center p-4 bg-white rounded-xl mb-3 shadow-sm">
            {icon}
            <Text className="ml-3 text-black text-base">{label}</Text>
        </Pressable>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#f0f0f0]">
            <ScrollView className="p-4">
                {/* Edit Profile */}
                <MenuItem
                    icon={<Ionicons name="person-outline" size={22} color="black" />}
                    label="Edit Profile"
                    onPress={() => router.push("/")}
                />

                {/* Help */}
                <MenuItem
                    icon={<Feather name="help-circle" size={22} color="black" />}
                    label="Help & Support"
                    onPress={() => router.push("/")}
                />

                {/* Privacy & Security */}
                <MenuItem
                    icon={<MaterialIcons name="security" size={22} color="black" />}
                    label="Privacy & Security"
                    onPress={() => router.push("/")}
                />

                {/* Notifications */}
                <MenuItem
                    icon={<Ionicons name="notifications-outline" size={22} color="black" />}
                    label="Notifications"
                    onPress={() => router.push("/")}
                />

                {/* About App */}
                <MenuItem
                    icon={<Ionicons name="information-circle-outline" size={22} color="black" />}
                    label="About App"
                    onPress={() => router.push("/")}
                />

                {/* Logout */}
                <MenuItem
                    icon={<MaterialIcons name="logout" size={22} color="red" />}
                    label="Logout"
                    onPress={handleLogout}
                />
            </ScrollView>
        </SafeAreaView>
    );
}