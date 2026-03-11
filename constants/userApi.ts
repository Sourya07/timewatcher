import apiClient from './axiosInstance';
import * as SecureStore from 'expo-secure-store';

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const userSignup = async (name: string, email: string, password: string) => {
    const res = await apiClient.post('/api/v1/user/signup', { name, email, password });
    return res.data; // { message: 'User created...' }
};

export const userSignin = async (email: string, password: string) => {
    const res = await apiClient.post('/api/v1/user/signin', { email, password });
    const { token } = res.data;
    await SecureStore.setItemAsync('usertoken', token); // persist JWT
    return res.data; // { token }
};

export const userGoogleSignin = async (idToken: string) => {
    const res = await apiClient.post('/api/v1/user/google', { idToken });
    const { token } = res.data;
    await SecureStore.setItemAsync('usertoken', token);
    return res.data; 
};

export const userAppleSignin = async (idToken: string, name?: string) => {
    const res = await apiClient.post('/api/v1/user/apple', { idToken, name });
    const { token } = res.data;
    await SecureStore.setItemAsync('usertoken', token);
    return res.data; 
};

export const userSignout = async () => {
    await SecureStore.deleteItemAsync('usertoken');
};

// ─── User Profile ──────────────────────────────────────────────────────────────

export const getUserProfile = async () => {
    const res = await apiClient.get('/api/v1/user/');
    return res.data;
};

export const saveUserProfile = async (data: {
    image?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    mobilenumber: string;
    UserID: number;
}) => {
    const res = await apiClient.post('/api/v1/user/', data);
    return res.data;
};

export const saveUserDetails = async (data: {
    image: string;
    latitude: number;
    longitude: number;
    address: string;
    mobilenumber: string;
}) => {
    const res = await apiClient.post('/api/v1/user/userdetails', data);
    return res.data;
};

// ─── Address Book ──────────────────────────────────────────────────────────────

export const getAddresses = async () => {
    const res = await apiClient.get('/api/v1/user/addresses');
    return res.data;
};

export const saveNewAddress = async (data: {
    tag: string;
    flatNo?: string;
    address: string;
    pincode?: string;
    mobileNo?: string;
    latitude: number;
    longitude: number;
    isDefault?: boolean;
}) => {
    const res = await apiClient.post('/api/v1/user/addresses', data);
    return res.data;
};

export const setDefaultAddress = async (addressId: number) => {
    const res = await apiClient.put(`/api/v1/user/addresses/${addressId}/default`);
    return res.data;
};

// ─── Shops ─────────────────────────────────────────────────────────────────────

export const getAllShops = async () => {
    const res = await apiClient.get('/api/v1/user/adminshops');
    return res.data; // { shops: [...] }
};
