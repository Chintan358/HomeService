import api from './api';

export const reviewService = {
  submitReview: async (reviewData) => {
    return api.post('/reviews/', reviewData);
  },

  getProviderReviews: async (providerId) => {
    return api.get(`/reviews/provider/${providerId}`);
  },

  getBookingReview: async (bookingId) => {
    return api.get(`/reviews/booking/${bookingId}`);
  },
};
