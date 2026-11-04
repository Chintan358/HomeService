/**
 * Admin API service — wraps all /admin/* endpoints.
 * All calls require a SUPER_ADMIN JWT (handled by the Axios interceptor in api.js).
 */
import api from "./api";

// ── Metrics ─────────────────────────────────────────────────────────
export const getMetrics = () => api.get("/admin/metrics").then((r) => r.data.data);

export const getRevenueTrend = (days = 30) =>
  api.get(`/admin/metrics/revenue-trend?days=${days}`).then((r) => r.data.data);

// ── Users ────────────────────────────────────────────────────────────
export const listUsers = (params = {}) =>
  api.get("/admin/users", { params }).then((r) => r.data.data);

export const updateUserStatus = (userId, account_status) =>
  api.patch(`/admin/users/${userId}/status`, { account_status }).then((r) => r.data);

// ── Providers ────────────────────────────────────────────────────────
export const listProviders = (params = {}) =>
  api.get("/admin/providers", { params }).then((r) => r.data.data);

export const verifyProvider = (providerId, action, rejection_reason = "") =>
  api
    .post(`/admin/providers/${providerId}/verify`, { action, rejection_reason })
    .then((r) => r.data);

// ── Reviews ──────────────────────────────────────────────────────────
export const listReviews = (params = {}) =>
  api.get("/admin/reviews", { params }).then((r) => r.data.data);

export const moderateReview = (reviewId, action) =>
  api.post(`/admin/reviews/${reviewId}/moderate`, { action }).then((r) => r.data);

// ── Services ─────────────────────────────────────────────────────────
export const listAllServices = (params = {}) =>
  api.get("/admin/services", { params }).then((r) => r.data.data);

export const toggleService = (serviceId, is_active) =>
  api.patch(`/admin/services/${serviceId}/toggle`, { is_active }).then((r) => r.data);
