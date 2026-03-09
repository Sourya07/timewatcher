// app/_layout.tsx
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import './globals.css';

export default function RootLayout() {

  useFonts({
    "QuickSand-Bold": require('../assets/fonts/Quicksand-Bold.ttf'),
    "QuickSand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
    "QuickSand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
    "QuickSand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
    "QuickSand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
  });

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}