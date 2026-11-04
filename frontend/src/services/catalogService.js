import api from './api';

export const catalogService = {
  getCategories: async () => {
    return api.get('/services/categories');
  },

  getServices: async (params = {}) => {
    return api.get('/services/', { params });
  },

  getServiceDetails: async (serviceId) => {
    return api.get(`/services/${serviceId}`);
  },

  createService: async (serviceData) => {
    return api.post('/services/', serviceData);
  },

  getMyServices: async () => {
    return api.get('/services/provider/my-services');
  },
};
