import apiClient from './axiosInstance';

// ─── Bookings ──────────────────────────────────────────────────────────────────

export const createBooking = async (data: {
    shopId: number;
    date: string;
    time: string;
    [key: string]: any;
}) => {
    const res = await apiClient.post('/api/v1/booking/', data);
    return res.data;
};

export const getMyBookings = async () => {
    const res = await apiClient.get('/api/v1/booking/');
    return res.data;
};

export const cancelBooking = async (bookingId: number) => {
    const res = await apiClient.delete(`/api/v1/booking/${bookingId}`);
    return res.data;
};
