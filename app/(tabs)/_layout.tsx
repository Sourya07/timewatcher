import { Image, Text, View, Animated, Platform } from "react-native";
import { images } from "@/constants";
import { Tabs } from "expo-router";
import { useEffect, useRef } from "react";

interface TabBarIconProps {
    focused: boolean;
    icon: any;
    title: string;
}

const ACTIVE_COLOR = "#007AFF";
const INACTIVE_COLOR = "#8E8E93";

const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => {
    const iconScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(iconScale, {
            toValue: focused ? 1.12 : 1,
            useNativeDriver: true,
            damping: 14,
            stiffness: 240,
            mass: 0.5,
        }).start();
    }, [focused]);

    return (
        <View
            style={{
                alignItems: "center",
                justifyContent: "center",
                paddingTop: Platform.OS === "ios" ? 8 : 6,
                minWidth: 80,
            }}
        >
            <Animated.Image
                source={icon}
                style={{
                    width: 20,
                    height: 20,
                    tintColor: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
                    transform: [{ scale: iconScale }],
                }}
                resizeMode="contain"
            />
            <Text
                numberOfLines={1}
                style={{
                    fontSize: 10,
                    fontWeight: focused ? "600" : "400",
                    color: focused ? ACTIVE_COLOR : INACTIVE_COLOR,
                    marginTop: 3,
                    letterSpacing: 0.1,
                    textAlign: "center",
                }}
            >
                {title}
            </Text>
        </View>
    );
};

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarHideOnKeyboard: true,
                tabBarStyle: {
                    height: Platform.OS === "ios" ? 84 : 60,
                    backgroundColor: "#FFFFFF",
                    borderTopWidth: 0.5,
                    borderTopColor: "rgba(0,0,0,0.12)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 8,
                    paddingBottom: Platform.OS === "ios" ? 24 : 4,
                    paddingTop: 0,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon title="Home" icon={images.home} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: "Explore",
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon title="Explore" icon={images.search} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: "Orders",
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon title="Orders" icon={images.bag} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon title="Profile" icon={images.person} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}