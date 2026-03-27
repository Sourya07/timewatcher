import apiClient from './axiosInstance';

export const getDashboardAnalytics = async () => {
    const res = await apiClient.get('/api/v1/analytics/dashboard');
    return res.data;
};

export const getServiceAnalytics = async () => {
    const res = await apiClient.get('/api/v1/analytics/services');
    return res.data;
};
