import api from "./api";

export const getNotifications = (limit = 20) =>
  api.get(`/notifications?limit=${limit}`).then((res) => res.data.data);

export const markNotificationRead = (notificationId) =>
  api.patch(`/notifications/${notificationId}/read`).then((res) => res.data);

export const markAllNotificationsRead = () =>
  api.post("/notifications/read-all").then((res) => res.data);
