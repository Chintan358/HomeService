import api from './api';

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const paymentService = {
  createOrder: async (bookingId) => {
    return api.post('/payments/create-order', { booking_id: bookingId });
  },

  verifyPayment: async (verificationData) => {
    return api.post('/payments/verify', verificationData);
  },

  getPaymentDetails: async (bookingId) => {
    return api.get(`/payments/booking/${bookingId}`);
  },
};
