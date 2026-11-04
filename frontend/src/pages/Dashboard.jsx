import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { catalogService } from '../services/catalogService';
import { bookingService } from '../services/bookingService';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import CreateServiceModal from '../features/services/CreateServiceModal';
import BookingCard from '../features/bookings/BookingCard';
import AvailabilityEditor from '../features/providers/AvailabilityEditor';
import TechniciansManager from '../features/providers/TechniciansManager';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Award,
  PlusCircle,
  Wrench,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  ExternalLink,
} from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [providerServices, setProviderServices] = useState([]);
  const [providerBookings, setProviderBookings] = useState([]);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providerTab, setProviderTab] = useState('orders'); // 'orders' | 'availability' | 'technicians'

  useEffect(() => {
    if (user?.role === 'PROVIDER') {
      loadProviderData();
    } else if (user?.role === 'CUSTOMER') {
      loadCustomerData();
    }
  }, [user]);

  const loadProviderData = async () => {
    try {
      setLoading(true);
      const [srvRes, bksRes, catRes] = await Promise.all([
        catalogService.getMyServices(),
        bookingService.getProviderBookings(),
        catalogService.getCategories(),
      ]);
      setProviderServices(srvRes.data || []);
      setProviderBookings(bksRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to load provider dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerData = async () => {
    try {
      const bksRes = await bookingService.getCustomerBookings();
      setCustomerBookings(bksRes.data || []);
    } catch (err) {
      console.error('Failed to load customer dashboard bookings', err);
    }
  };

  const handleProviderStatusChange = async (bookingId, newStatus) => {
    try {
      const res = await bookingService.updateStatus(bookingId, {
        status: newStatus,
        note: `Provider updated status to ${newStatus}`,
      });
      setProviderBookings(providerBookings.map((b) => (b.id === bookingId ? res.data : b)));
    } catch (err) {
      alert(err.message || 'Failed to update job status.');
    }
  };

  const handleServiceCreated = (newService) => {
    setProviderServices([newService, ...providerServices]);
  };

  if (!user) return null;

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'danger';
      case 'PROVIDER': return 'warning';
      case 'TECHNICIAN': return 'primary';
      default: return 'success';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-blue-500/20">
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{user.full_name}</h1>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {user.role}
                </Badge>
                <Badge variant="success">
                  {user.account_status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4" /> {user.email}
                {user.phone && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Phone className="w-4 h-4" /> {user.phone}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/services">
              <Button variant="secondary" size="md">
                Browse Marketplace
              </Button>
            </Link>
            <Button variant="outline" size="md" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Provider Dashboard Section */}
      {user.role === 'PROVIDER' && user.provider_profile && (
        <div className="space-y-8">
          {/* Business Stats Overview */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    {user.provider_profile.business_name}
                  </h2>
                  <Link
                    to={`/providers/${user.provider_profile.id}`}
                    target="_blank"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                  >
                    View Public Page <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage incoming customer orders, technician dispatch, availability schedule, and service catalog.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Add New Service
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm mb-6">
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-xs">KYC Verification</span>
                <Badge variant={user.provider_profile.verification_status === 'APPROVED' ? 'success' : 'warning'} className="mt-1">
                  {user.provider_profile.verification_status}
                </Badge>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-xs">Rating</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 mt-1">
                  <Award className="w-4 h-4 text-amber-500" />
                  {user.provider_profile.average_rating} ({user.provider_profile.review_count} reviews)
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-xs">Active Jobs</span>
                <span className="font-extrabold text-blue-600 text-lg mt-1 block">
                  {providerBookings.filter((b) => ['PENDING', 'ACCEPTED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'].includes(b.status)).length}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block text-xs">Published Services</span>
                <span className="font-extrabold text-slate-800 text-lg mt-1 block">
                  {providerServices.length}
                </span>
              </div>
            </div>

            {/* Provider Tabs */}
            <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
              <button
                onClick={() => setProviderTab('orders')}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                  providerTab === 'orders'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Calendar className="w-4 h-4" /> Orders & Catalog
              </button>
              <button
                onClick={() => setProviderTab('availability')}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                  providerTab === 'availability'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" /> Working Hours & Schedule
              </button>
              <button
                onClick={() => setProviderTab('technicians')}
                className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                  providerTab === 'technicians'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Users className="w-4 h-4" /> Field Technicians
              </button>
            </div>
          </div>

          {/* Tab 1: Orders & Catalog */}
          {providerTab === 'orders' && (
            <div className="space-y-8">
              {/* Incoming Customer Booking Orders */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Incoming Customer Booking Requests ({providerBookings.length})
                </h3>

                {providerBookings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providerBookings.map((b) => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        isProviderView={true}
                        onStatusChange={handleProviderStatusChange}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                    No booking requests received yet.
                  </div>
                )}
              </div>

              {/* Provider Services Table */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  My Published Services ({providerServices.length})
                </h3>
                {providerServices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                          <th className="py-3 px-4">Service</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Base Price</th>
                          <th className="py-3 px-4">Est. Duration</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {providerServices.map((srv) => (
                          <tr key={srv.id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-semibold text-slate-800">{srv.name}</td>
                            <td className="py-3 px-4 text-slate-600">{srv.category?.name || 'General'}</td>
                            <td className="py-3 px-4 font-bold text-blue-600">{formatCurrency(srv.base_price)}</td>
                            <td className="py-3 px-4 text-slate-600">{srv.estimated_duration_minutes} mins</td>
                            <td className="py-3 px-4">
                              <Badge variant={srv.is_active ? 'success' : 'default'}>
                                {srv.is_active ? 'Active' : 'Draft'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">No services listed yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Availability */}
          {providerTab === 'availability' && <AvailabilityEditor />}

          {/* Tab 3: Technicians */}
          {providerTab === 'technicians' && <TechniciansManager />}

          <CreateServiceModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            categories={categories}
            onServiceCreated={handleServiceCreated}
          />
        </div>
      )}

      {/* Customer Dashboard View */}
      {user.role === 'CUSTOMER' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm md:col-span-2">
              <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Active Appointments ({customerBookings.filter(b => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length})
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                You have active scheduled visits. You can track technician progress, view appointments, and book new services.
              </p>
              <div className="flex items-center gap-3">
                <Link to="/my-bookings">
                  <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                    View My Bookings <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="secondary" size="sm">
                    Browse Services
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Customer Protection
              </h2>
              <ul className="text-xs text-slate-600 space-y-2.5">
                <li className="flex items-center gap-2">✓ Background verified technicians</li>
                <li className="flex items-center gap-2">✓ Real-time status updates</li>
                <li className="flex items-center gap-2">✓ Full service history records</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
