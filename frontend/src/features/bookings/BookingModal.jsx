import React, { useState } from 'react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { X, Calendar, MapPin, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function BookingModal({ isOpen = true, onClose, service, onBookingSuccess }) {
  const { user } = useAuth();

  // Tomorrow by default
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  defaultDate.setHours(10, 0, 0, 0);
  const formattedDefaultDate = defaultDate.toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    scheduled_start_at: formattedDefaultDate,
    problem_description: '',
    recipient_name: user?.full_name || '',
    recipient_phone: user?.phone || '',
    address_line1: '',
    city: 'Mumbai',
    postal_code: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen || !service) return null;

  const basePrice = parseFloat(service.base_price || 0);
  const tax = Math.round(basePrice * 0.05 * 100) / 100;
  const total = basePrice + tax;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.scheduled_start_at || !formData.address_line1 || !formData.postal_code) {
      setError('Please provide date/time and your complete address.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        service_id: service.id,
        scheduled_start_at: new Date(formData.scheduled_start_at).toISOString(),
        problem_description: formData.problem_description || undefined,
        address: {
          recipient_name: formData.recipient_name || user?.full_name || 'Customer',
          recipient_phone: formData.recipient_phone || user?.phone || '0000000000',
          address_line1: formData.address_line1,
          city: formData.city,
          postal_code: formData.postal_code,
          country_code: 'IN',
        },
      };

      const res = await bookingService.createBooking(payload);
      setSuccess(true);
      setTimeout(() => {
        if (onBookingSuccess) onBookingSuccess(res.data);
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to schedule booking appointment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Book Service Appointment</h3>
            <p className="text-xs text-slate-500 mt-0.5">{service.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Booking confirmed! Redirecting...</span>
            </div>
          )}

          {/* Service Price Summary Box */}
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Service Fee</span>
              <span className="font-bold text-slate-800 text-sm">{formatCurrency(basePrice)}</span>
              <span className="text-[10px] text-slate-400 block">+ 5% tax ({formatCurrency(tax)})</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-blue-600 font-semibold block">Total Payable</span>
              <span className="font-extrabold text-blue-700 text-xl">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Schedule Date & Time */}
          <div>
            <label htmlFor="scheduled_start_at" className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Appointment Date & Time
            </label>
            <input
              type="datetime-local"
              id="scheduled_start_at"
              name="scheduled_start_at"
              value={formData.scheduled_start_at}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Address Section */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Service Location
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Contact Name"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={handleChange}
                required
              />
              <Input
                label="Phone Number"
                name="recipient_phone"
                value={formData.recipient_phone}
                onChange={handleChange}
                required
              />
            </div>
            <Input
              label="Flat / Street / Landmark"
              name="address_line1"
              placeholder="e.g. 302 Green Valley Apt, Opp Central Mall"
              value={formData.address_line1}
              onChange={handleChange}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
              <Input
                label="Postal Code"
                name="postal_code"
                placeholder="400001"
                value={formData.postal_code}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Problem Description */}
          <div>
            <label htmlFor="problem_description" className="block text-sm font-medium text-slate-700 mb-1">
              Notes for the Technician (Optional)
            </label>
            <textarea
              id="problem_description"
              name="problem_description"
              rows="2"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the issue or any gate codes / entry instructions..."
              value={formData.problem_description}
              onChange={handleChange}
            />
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Confirm Appointment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
