// types/shop.ts

import { create } from "zustand";
export interface Shop {
    id: number; // add id for identifying shops
    name?: string;
    image?: string;
    address: string;
    mobilenumber: string;
    occupation: string;
    latitude: string;
    longitude: string
    timein: number;
    timeout: number;
    price: number;
}

interface ShopState {
    shops: Shop[];
    setShops: (shops: Shop[]) => void;
    getShopById: (id: string) => Shop | undefined;
}

export const useShopStore = create<ShopState>((set, get) => ({
    shops: [],
    setShops: (shops) => set({ shops }),
    getShopById: (id) => get().shops.find((shop) => shop.id === Number(id)),

}));