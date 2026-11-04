import api from "./api";

export const getProviders = (verifiedOnly = true) =>
  api.get(`/providers?verified_only=${verifiedOnly}`).then((res) => res.data.data);

export const getProviderProfile = (providerId) =>
  api.get(`/providers/${providerId}/profile`).then((res) => res.data.data);

export const getProviderSlots = (providerId, dateStr) =>
  api.get(`/providers/${providerId}/slots?date=${dateStr}`).then((res) => res.data.data);

export const getMyAvailability = () =>
  api.get("/providers/me/availability").then((res) => res.data.data);

export const updateMyAvailability = (schedule) =>
  api.put("/providers/me/availability", { schedule }).then((res) => res.data);

export const getMyTechnicians = () =>
  api.get("/providers/me/technicians").then((res) => res.data.data);

export const addTechnician = (data) =>
  api.post("/providers/me/technicians", data).then((res) => res.data);

export const assignTechnician = (bookingId, technicianUserId, notes = "") =>
  api.post(`/bookings/${bookingId}/assign-technician`, {
    technician_user_id: technicianUserId,
    notes,
  }).then((res) => res.data);

export const getBookingTechnician = (bookingId) =>
  api.get(`/bookings/${bookingId}/technician`).then((res) => res.data.data);
