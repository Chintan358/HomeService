import api from './api';

export const bookingService = {
  createBooking: async (bookingData) => {
    return api.post('/bookings/', bookingData);
  },

  getCustomerBookings: async () => {
    return api.get('/bookings/my-bookings');
  },

  getProviderBookings: async () => {
    return api.get('/bookings/provider-bookings');
  },

  getBookingDetails: async (bookingId) => {
    return api.get(`/bookings/${bookingId}`);
  },

  updateStatus: async (bookingId, payload) => {
    return api.patch(`/bookings/${bookingId}/status`, payload);
  },
};
