// types/shop.ts (or your Zustand store file)
import { create } from "zustand";
import axios from "axios";

export interface Shop {
    id: number;
    name: string;
    image?: string;
    address: string;
    mobilenumber: string;
    occupation: string;
    speclization: string

    latitude: number;
    longitude: number;
    timein: number;
    timeout: number;
    price: number;
}

interface ShopState {
    shops: Shop[];
    loading: boolean;
    error: string | null;
    setShops: (shops: Shop[]) => void;
    getShopById: (id: string) => Shop | undefined;
    getShopByname: (name: string) => Shop[];
    fetchShops: () => Promise<void>;
}

export const useShopStore = create<ShopState>((set, get) => ({
    shops: [],
    loading: false,
    error: null,

    setShops: (shops) => set({ shops }),

    getShopById: (id) => get().shops.find((shop) => shop.id === Number(id)),

    getShopByname: (name) =>
        get().shops.filter((shop) => shop.occupation.toLowerCase() === name.toLowerCase()),
    fetchShops: async () => {
        set({ loading: true, error: null });
        try {
            const res = await axios.get(
                "https://timewatcher.onrender.com/api/v1/user/adminshops"
            );
            set({ shops: res.data.shops || [], loading: false });
        } catch (error: any) {
            set({ error: error.message || "Failed to fetch shops", loading: false });
        }
    },
}));