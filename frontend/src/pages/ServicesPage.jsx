import React, { useState, useEffect } from 'react';
import { catalogService } from '../services/catalogService';
import ServiceCard from '../features/services/ServiceCard';
import CategoryFilter from '../features/services/CategoryFilter';
import BookingModal from '../features/bookings/BookingModal';
import { Search, SlidersHorizontal, AlertCircle, Wrench, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ServicesPage() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Modal State
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchServices();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, srvRes] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getServices(),
      ]);
      setCategories(catRes.data || []);
      setServices(srvRes.data || []);
    } catch (err) {
      setError('Could not load services catalog. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const params = {};
      if (selectedCategory) params.category_id = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await catalogService.getServices(params);
      setServices(res.data || []);
    } catch (err) {
      console.error('Failed to fetch filtered services', err);
    }
  };

  const handleBook = (service) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSelectedServiceForBooking(service);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = (booking) => {
    navigate('/my-bookings');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Home Services
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Book verified local technicians, plumbers, and home care specialists with upfront pricing.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search services by keyword (e.g. leak, fan, cleaning, electrical)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-slate-400"
          />
        </div>

        {/* Category Filter Pills */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-3 mb-6 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-80 border border-slate-200 animate-pulse p-4">
              <div className="w-full h-44 bg-slate-200 rounded-xl mb-4" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : services.length > 0 ? (
        /* Services Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onBook={handleBook} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No services match your criteria</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or selecting a different category.
          </p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery('');
            }}
            className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Booking Modal */}
      {selectedServiceForBooking && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedServiceForBooking(null);
          }}
          service={selectedServiceForBooking}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
