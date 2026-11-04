import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ShieldCheck,
  Star,
  Clock,
  Briefcase,
  MapPin,
  CheckCircle,
  Calendar,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import BookingModal from "../features/bookings/BookingModal";
import { getProviderProfile } from "../services/providerService";
import { formatCurrency } from "../utils/formatters";

const DAY_NAMES = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

export default function ProviderProfilePage() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await getProviderProfile(id);
        setProvider(data);
      } catch (err) {
        setError("Provider profile could not be loaded.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        Loading provider profile...
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500 font-semibold mb-4">{error || "Provider not found"}</p>
        <Link to="/services">
          <Button variant="outline">Back to Services</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 mb-6 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to all services
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
                {provider.business_name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {provider.business_name}
                  </h1>
                  {provider.verification_status === "APPROVED" && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{parseFloat(provider.average_rating || 0).toFixed(1)}</span>
                    <span className="text-slate-400 font-normal">
                      ({provider.review_count} reviews)
                    </span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>{provider.services?.length || 0} Services offered</span>
                  </div>
                </div>

                {provider.business_description && (
                  <p className="mt-3 text-sm text-slate-600 max-w-2xl leading-relaxed">
                    {provider.business_description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Services & Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Services */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" /> Services by {provider.business_name}
            </h2>
            {provider.services?.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                No active services listed yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {provider.services.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {s.category && (
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">
                          {s.category.name}
                        </span>
                      )}
                      <h3 className="font-bold text-slate-900 text-base mt-2">{s.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {s.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Starting at</span>
                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(s.base_price)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedService(s)}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Reviews */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" /> Customer Reviews (
              {provider.reviews?.length || 0})
            </h2>

            {provider.reviews?.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                No customer reviews yet.
              </div>
            ) : (
              <div className="space-y-3">
                {provider.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-xs text-slate-900">
                        {rev.customer?.full_name || "Verified Customer"}
                      </span>
                      <div className="flex text-amber-400 text-xs">
                        {"★".repeat(rev.rating)}
                        {"☆".repeat(5 - rev.rating)}
                      </div>
                    </div>
                    {rev.review_text && (
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.review_text}</p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-2 block">
                      {new Date(rev.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Working Hours & Contact */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" /> Weekly Working Hours
            </h3>

            {provider.availability?.length === 0 ? (
              <p className="text-xs text-slate-400">Monday – Saturday: 9:00 AM – 6:00 PM</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {provider.availability.map((slot) => (
                  <div key={slot.id} className="py-2.5 flex justify-between items-center">
                    <span className="font-medium text-slate-700">
                      {DAY_NAMES[slot.day_of_week] || `Day ${slot.day_of_week}`}
                    </span>
                    {slot.is_available ? (
                      <span className="text-slate-600 font-mono">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
            <h4 className="font-bold text-base mb-1">Guaranteed Service</h4>
            <p className="text-xs text-blue-100 leading-relaxed mb-4">
              All bookings with verified service providers include guaranteed satisfaction, vetted technicians, and transparent online payments.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-100">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              100% Razorpay Secure Checkout
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedService && (
        <BookingModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onBookingCreated={() => setSelectedService(null)}
        />
      )}
    </div>
  );
}
