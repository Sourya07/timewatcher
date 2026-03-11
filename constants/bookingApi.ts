import apiClient from './axiosInstance';

// ─── Bookings ──────────────────────────────────────────────────────────────────

export const createBooking = async (data: {
    shopServiceId: number;
    duration: number;
    price: number;
    bookingStart: string;
    bookingEnd: string;
}) => {
    const res = await apiClient.post('/api/v1/booking/', data);
    return res.data;
};

export const getShopSlots = async (shopId: number, date: string, serviceId?: number) => {
    let url = `/api/v1/booking/slots/${shopId}?date=${date}`;
    if (serviceId) {
        url += `&serviceId=${serviceId}`;
    }
    const res = await apiClient.get(url);
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
