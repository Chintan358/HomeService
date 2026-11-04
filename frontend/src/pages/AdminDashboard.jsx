/**
 * AdminDashboard page — Super Admin control panel.
 *
 * Tabs:
 *   Overview   — platform KPIs (users, bookings, revenue, pending actions)
 *   Users      — user management with suspend/activate
 *   Providers  — KYC verification queue (approve / reject)
 *   Reviews    — review moderation queue
 *   Services   — platform-wide service toggle
 *
 * Access: SUPER_ADMIN role only (guarded by ProtectedRoute + role check).
 */
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Briefcase, Star, Wrench,
  TrendingUp, IndianRupee, CalendarCheck, AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMetrics } from "../services/adminService";
import MetricsCard from "../features/admin/MetricsCard";
import AdminUsersTable from "../features/admin/AdminUsersTable";
import AdminProvidersTable from "../features/admin/AdminProvidersTable";
import AdminReviewsTable from "../features/admin/AdminReviewsTable";
import AdminServicesTable from "../features/admin/AdminServicesTable";
import { formatCurrency } from "../utils/formatters";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "providers", label: "Providers KYC", icon: Briefcase },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "services", label: "Services", icon: Wrench },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState("");

  // Guard: only SUPER_ADMIN
  if (!user || user.role !== "SUPER_ADMIN") {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetchMetrics = async () => {
      setMetricsLoading(true);
      setMetricsError("");
      try {
        const data = await getMetrics();
        setMetrics(data);
      } catch {
        setMetricsError("Failed to load platform metrics.");
      } finally {
        setMetricsLoading(false);
      }
    };
    if (activeTab === "overview") fetchMetrics();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform control panel · Super Admin</p>
      </div>

      {/* Tab nav */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {/* Badge for pending actions */}
                {tab.id === "providers" && metrics?.pending_actions?.provider_verifications > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {metrics.pending_actions.provider_verifications}
                  </span>
                )}
                {tab.id === "reviews" && metrics?.pending_actions?.review_moderations > 0 && (
                  <span className="bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {metrics.pending_actions.review_moderations}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Overview ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {metricsError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {metricsError}
              </div>
            )}

            {/* User KPIs */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3">Users</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricsCard icon={Users} label="Total Users" value={metrics?.users?.total} loading={metricsLoading} color="blue" />
                <MetricsCard icon={Users} label="Customers" value={metrics?.users?.customers} loading={metricsLoading} color="green" />
                <MetricsCard icon={Briefcase} label="Providers" value={metrics?.users?.providers} loading={metricsLoading} color="indigo" />
                <MetricsCard icon={Wrench} label="Technicians" value={metrics?.users?.technicians} loading={metricsLoading} color="yellow" />
              </div>
            </section>

            {/* Booking KPIs */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3">Bookings</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricsCard icon={CalendarCheck} label="Total Bookings" value={metrics?.bookings?.total} loading={metricsLoading} color="blue" />
                <MetricsCard icon={CalendarCheck} label="Completed" value={metrics?.bookings?.completed}
                  sub={metrics ? `${metrics.bookings.completion_rate}% completion rate` : ""}
                  loading={metricsLoading} color="green" />
                <MetricsCard icon={CalendarCheck} label="In Progress" value={metrics?.bookings?.in_progress} loading={metricsLoading} color="yellow" />
                <MetricsCard icon={CalendarCheck} label="Cancelled" value={metrics?.bookings?.cancelled} loading={metricsLoading} color="red" />
              </div>
            </section>

            {/* Revenue KPIs */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3">Revenue</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <MetricsCard
                  icon={IndianRupee}
                  label="Total Revenue"
                  value={metrics ? formatCurrency(metrics.revenue.total) : null}
                  loading={metricsLoading}
                  color="green"
                />
                <MetricsCard
                  icon={TrendingUp}
                  label="This Month"
                  value={metrics ? formatCurrency(metrics.revenue.this_month) : null}
                  loading={metricsLoading}
                  color="blue"
                />
              </div>
            </section>

            {/* Pending Actions */}
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3">Pending Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                <MetricsCard
                  icon={AlertCircle}
                  label="Provider KYC Pending"
                  value={metrics?.pending_actions?.provider_verifications}
                  sub="Click Providers KYC tab to review"
                  loading={metricsLoading}
                  color="yellow"
                />
                <MetricsCard
                  icon={Star}
                  label="Reviews Pending Moderation"
                  value={metrics?.pending_actions?.review_moderations}
                  sub="Click Reviews tab to moderate"
                  loading={metricsLoading}
                  color="purple"
                />
              </div>
            </section>
          </div>
        )}

        {/* ── Users Tab ─────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
            <AdminUsersTable />
          </div>
        )}

        {/* ── Providers Tab ─────────────────────────────────────── */}
        {activeTab === "providers" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider KYC Verification</h2>
            <AdminProvidersTable />
          </div>
        )}

        {/* ── Reviews Tab ───────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Moderation</h2>
            <AdminReviewsTable />
          </div>
        )}

        {/* ── Services Tab ──────────────────────────────────────── */}
        {activeTab === "services" && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Catalog Management</h2>
            <AdminServicesTable />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
