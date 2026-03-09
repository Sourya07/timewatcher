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

// ─── Admin Shop ────────────────────────────────────────────────────────────────

export interface AdminShopPayload {
    image: string;
    latitude: number | null;
    longitude: number | null;
    address: string;
    mobilenumber: string;
    occupation: string;
    speclization: string;
    timein: string;
    timeout: string;
    price: number;
}

export const createAdminShop = async (payload: AdminShopPayload) => {
    const res = await apiClient.post('/api/v1/admin/adminshop', payload);
    return res.data;
};
