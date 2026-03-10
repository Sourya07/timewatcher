import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Appearance } from "react-native";

export const Colors = {
  light: {
    primary: "#1877F2",
    background: "#F0F2F5",
    surface: "#FFFFFF",
    text: "#050505",
    textMuted: "#65676B",
    border: "#E4E6EB",
    success: "#31A24C",
    danger: "#F02849",
    warning: "#F7B928",
    headerGradientStart: "#1877F2",
    headerGradientEnd: "#1456A8",
  },
  dark: {
    primary: "#2D88FF",
    background: "#18191A",
    surface: "#242526",
    text: "#E4E6EB",
    textMuted: "#B0B3B8",
    border: "#3A3B3C",
    success: "#31A24C",
    danger: "#F02849",
    warning: "#F7B928",
    headerGradientStart: "#2D88FF",
    headerGradientEnd: "#1D3C78",
  },
};

type Palette = typeof Colors.light;

type ThemeState = {
  isDarkMode: boolean;
  colors: Palette;
  toggleTheme: () => Promise<void>;
  setDarkMode: (value: boolean) => void;
  hydrateTheme: () => Promise<void>;
};

const STORAGE_KEY = "theme_preference";

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: true,
  colors: Colors.dark,

  setDarkMode: (value: boolean) => {
    set({
      isDarkMode: value,
      colors: value ? Colors.dark : Colors.light,
    });
  },

  toggleTheme: async () => {
    const next = !get().isDarkMode;
    set({
      isDarkMode: next,
      colors: next ? Colors.dark : Colors.light,
    });

    try {
      await SecureStore.setItemAsync(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // ignore persistence errors
    }
  },

  hydrateTheme: async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored === "dark" || stored === "light") {
        const isDark = stored === "dark";
        set({
          isDarkMode: isDark,
          colors: isDark ? Colors.dark : Colors.light,
        });
        return;
      }
    } catch {
      // fall back to system preference
    }

    // Default to dark mode if no preference saved
    set({
      isDarkMode: true,
      colors: Colors.dark,
    });
  },
}));

// (legacy duplicated theme definitions removed)
