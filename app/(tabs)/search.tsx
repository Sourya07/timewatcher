import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Image, TouchableOpacity, Pressable, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useShopStore } from '@/Store/shopstore';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/Store/themeStore';
const CATEGORIES = ['All', 'Doctor', 'Advocate', 'Barber', 'Teacher', 'Courier', 'Photographer', 'Government Services'];

export default function Search() {
    const { shops, fetchShops, loading } = useShopStore();
    const { colors } = useThemeStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        if (shops.length === 0) fetchShops();
    }, []);

    const getFilteredShops = () => {
        let filtered = shops;

        // Category filter
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(shop =>
                shop.occupation && shop.occupation.toLowerCase().includes(selectedCategory.toLowerCase())
            );
        }

        // Search text filter
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(shop =>
                (shop.name && shop.name.toLowerCase().includes(lowerQuery)) ||
                (shop.occupation && shop.occupation.toLowerCase().includes(lowerQuery)) ||
                (shop.speclization && shop.speclization.toLowerCase().includes(lowerQuery))
            );
        }

        return filtered;
    };

    const currentShops = getFilteredShops();

    if (loading && shops.length === 0) {
        return (
            <SafeAreaView
                style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}
            >
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
            
            {/* Header & Search Bar */}
            <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
                <Text
                    style={{
                        fontSize: 32,
                        fontWeight: '800',
                        color: colors.text,
                        letterSpacing: -1,
                        marginBottom: 16,
                    }}
                >
                    Explore
                </Text>
                
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    height: 52,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 3,
                }}
            >
                    <Ionicons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search for doctors, barbers..."
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{
                            flex: 1,
                            marginLeft: 12,
                            fontSize: 15,
                            color: colors.text,
                            height: '100%',
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#D1D5DB" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categories */}
            <View style={{ paddingBottom: 16 }}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
                >
                    {CATEGORIES.map((category) => {
                        const isActive = selectedCategory === category;
                        return (
                            <TouchableOpacity
                                key={category}
                                onPress={() => setSelectedCategory(category)}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                    backgroundColor: isActive ? colors.primary : colors.surface,
                                    borderWidth: 1,
                                    borderColor: isActive ? colors.primary : colors.border,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: isActive ? 0.2 : 0.02,
                                    shadowRadius: 4,
                                    elevation: isActive ? 4 : 1,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: isActive ? '700' : '600',
                                        color: isActive ? colors.surface : colors.textMuted,
                                    }}
                                >
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Providers List */}
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: '700',
                        color: colors.text,
                        marginBottom: 16,
                    }}
                >
                    {selectedCategory === 'All' ? 'Popular Providers' : `${selectedCategory}s`}
                </Text>

                {currentShops.length === 0 ? (
                    // Empty State
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
                        <View
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: colors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20,
                            }}
                        >
                            <Ionicons name="search-outline" size={32} color="#A0ABBB" />
                        </View>
                        <Text
                            style={{
                                fontSize: 18,
                                fontWeight: '700',
                                color: colors.text,
                                marginBottom: 8,
                            }}
                        >
                            No providers found
                        </Text>
                        <Text
                            style={{
                                fontSize: 14,
                                color: colors.textMuted,
                                textAlign: 'center',
                                paddingHorizontal: 30,
                            }}
                        >
                            Try adjusting your search query or category filter.
                        </Text>
                    </View>
                ) : (
                    // Provider Cards
                    currentShops.map((shop, idx) => (
                        <Pressable
                            key={shop.id || idx}
                            onPress={() => router.push(`/shops/${shop.id}`)}
                            style={{
                                flexDirection: 'row',
                                backgroundColor: colors.surface,
                                borderRadius: 16,
                                padding: 12,
                                marginBottom: 12,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.04,
                                shadowRadius: 6,
                                elevation: 2,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}
                        >
                            <Image
                                source={{ uri: shop.image || 'https://via.placeholder.com/100' }}
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 12,
                                    backgroundColor: colors.background,
                                }}
                            />
                            
                            <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 4,
                                            backgroundColor: colors.background,
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                            borderRadius: 6,
                                        }}
                                    >
                                        <MaterialIcons name="work" size={10} color={colors.primary} />
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                fontWeight: '700',
                                                color: colors.primary,
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {shop.occupation}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                        <Ionicons name="star" size={12} color="#F59E0B" />
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                fontWeight: '700',
                                                color: colors.text,
                                            }}
                                        >
                                            4.8
                                        </Text>
                                    </View>
                                </View>
                                
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontWeight: '800',
                                        color: colors.text,
                                        marginBottom: 2,
                                    }}
                                    numberOfLines={1}
                                >
                                    {shop.name || `Best ${shop.occupation}`}
                                </Text>
                                
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                    <Ionicons name="location-sharp" size={12} color="#9CA3AF" />
                                    <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
                                        {shop.address || 'Local Area'}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                        ₹{shop.services?.[0]?.price || 0}
                                        <Text
                                            style={{
                                                fontSize: 11,
                                                color: colors.textMuted,
                                                fontWeight: '500',
                                            }}
                                        >
                                            {' '}starting
                                        </Text>
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '600',
                                            color: colors.primary,
                                        }}
                                    >
                                        Book Now →
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
