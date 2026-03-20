import apiClient from './axiosInstance';

// ─── Admin Auth ────────────────────────────────────────────────────────────────

export const adminSignup = async (name: string, email: string, password: string) => {
    const res = await apiClient.post('/api/v1/admin/signup', { name, email, password });
    return res.data;
};

export const adminSignin = async (email: string, password: string) => {
    const res = await apiClient.post('/api/v1/admin/signin', { email, password });
    return res.data; // { token }
};

export const registerAdminPushToken = async (pushToken: string) => {
    const res = await apiClient.post('/api/v1/notifications/register-admin-token', { pushToken });
    return res.data;
};

// ─── Admin Shop ────────────────────────────────────────────────────────────────

export interface AdminShopPayload {
    image: string;
    images?: string[];
    latitude: number | null;
    longitude: number | null;
    address: string;
    mobilenumber: string;
    occupation: string;
    speclization: string;
    timein: string;
    timeout: string;
    categoryName?: string;
    isOpen?: boolean;
    services?: {
        name: string;
        price: number;
        durationMins: number;
    }[];
}

export const createAdminShop = async (payload: AdminShopPayload) => {
    const res = await apiClient.post('/api/v1/admin/adminshop', payload);
    return res.data;
};

export const updateAdminShopSettings = async (shopId: number, settings: { isOpen?: boolean }) => {
    const res = await apiClient.patch(`/api/v1/admin/adminshop/${shopId}/settings`, settings);
    return res.data;
};

export const getAdminShopBookings = async (shopId: number) => {
    const res = await apiClient.get(`/api/v1/admin/adminshop/${shopId}/bookings`);
    return res.data;
};
