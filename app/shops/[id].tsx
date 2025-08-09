import { View, Text, Image, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

interface ShopDetailsParams {
    name?: string;
    image?: any;
    address?: string;
    mobilenumber?: string;
    occupation?: string;
    timein?: string;  // "09:00"
    timeout?: string; // "10:00"
    price?: string;
}

export default function ShopDetails() {
    const { name, image, address, mobilenumber, occupation, timein, timeout, price } =
        useLocalSearchParams() as ShopDetailsParams;

    const [remainingTime, setRemainingTime] = useState<string>("");

    useEffect(() => {
        if (!timein || !timeout) return;

        const interval = setInterval(() => {
            const now = new Date();

            const [startHour, startMin] = timein.split(":").map(Number);
            const [endHour, endMin] = timeout.split(":").map(Number);

            const startTime = new Date(now);
            startTime.setHours(startHour, startMin, 0, 0);

            const endTime = new Date(now);
            endTime.setHours(endHour, endMin, 0, 0);

            // If timeout is before or equal to timein, move endTime to next day
            if (endTime <= startTime) {
                endTime.setDate(endTime.getDate() + 1);
            }

            let diff = endTime.getTime() - now.getTime();

            if (diff <= 0) {
                setRemainingTime("Closed");
                clearInterval(interval);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setRemainingTime(
                `${hours.toString().padStart(2, '0')}:${minutes
                    .toString()
                    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [timein, timeout]);
    return (
        <ScrollView className="flex-1 bg-white p-4">
            <Image
                source={{ uri: image || 'https://via.placeholder.com/200' }}
                className="w-full h-48 rounded-lg mb-4"
            />

            <Text className="text-2xl font-bold">{name || occupation}</Text>
            <Text className="text-gray-600 mt-1">📍 {address}</Text>
            <Text className="text-gray-500">📞 {mobilenumber}</Text>
            <Text className="text-gray-500">
                ⏱ {timein} - {timeout} mins
            </Text>

            {/* Countdown Timer */}
            {remainingTime && (
                <Text className="mt-2 text-lg font-semibold text-red-500">
                    Time left: {remainingTime}
                </Text>
            )}

            <Text className="mt-4 text-lg font-semibold text-black">
                PRICE ₹{price}
            </Text>

            <Text className="mt-6 text-base text-gray-700">
                This is the shop details page. You can add reviews, offers, or a description here.
            </Text>
        </ScrollView>
    );
}