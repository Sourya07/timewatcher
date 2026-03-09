// Store/shopstore.tsx
import { create } from "zustand";
import apiClient from "@/constants/axiosInstance";

export interface Shop {
    id: number;
    name: string;
    image?: string;
    address: string;
    mobilenumber: string;
    occupation: string;
    speclization: string;
    latitude: number;
    longitude: number;
    timein: string;
    timeout: string;
    price: number;
    isOpen?: boolean;
    slotDuration?: number;
}

interface ShopState {
    shops: Shop[];
    loading: boolean;
    error: string | null;
    setShops: (shops: Shop[]) => void;
    getShopById: (id: string) => Shop | undefined;
    getShopByname: (name: string) => Shop[];
    fetchShops: () => Promise<Shop[]>;
}

export const useShopStore = create<ShopState>((set, get) => ({
    shops: [],
    loading: false,
    error: null,

    setShops: (shops) => set({ shops }),

    getShopById: (id) => get().shops.find((shop) => shop.id === Number(id)),

    getShopByname: (name) =>
        get().shops.filter(
            (shop) => shop.occupation.toLowerCase() === name.toLowerCase()
        ),

    fetchShops: async () => {
        set({ loading: true, error: null });
        try {
            const res = await apiClient.get("/api/v1/user/adminshops");
            const shops: Shop[] = res.data.shops || [];
            set({ shops, loading: false });
            return shops;
        } catch (error: any) {
            set({ error: error.message || "Failed to fetch shops", loading: false });
            return [];
        }
    },
}));