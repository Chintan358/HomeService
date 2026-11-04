import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';
import { paymentService, loadRazorpayScript } from '../services/paymentService';
import BookingCard from '../features/bookings/BookingCard';
import ReviewModal from '../features/reviews/ReviewModal';
import Button from '../components/common/Button';
import { Calendar, Wrench, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [paymentNotice, setPaymentNotice] = useState('');

  // Review Modal State
  const [reviewBooking, setReviewBooking] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
    loadRazorpayScript(); // pre-load Razorpay checkout script
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingService.getCustomerBookings();
      setBookings(res.data || []);
    } catch (err) {
      setError('Failed to load your bookings. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    const reason = prompt('Please enter cancellation reason:') || 'Customer requested cancellation.';
    try {
      const res = await bookingService.updateStatus(bookingId, {
        status: newStatus,
        cancellation_reason: reason,
        note: reason,
      });
      setBookings(bookings.map((b) => (b.id === bookingId ? res.data : b)));
    } catch (err) {
      alert(err.message || 'Failed to update booking status.');
    }
  };

  // Razorpay Checkout Flow
  const handlePay = async (booking) => {
    try {
      setPaymentNotice('Initializing secure Razorpay payment...');
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Could not load Razorpay SDK. Please check your internet connection.');
        setPaymentNotice('');
        return;
      }

      // Step 1: Initialize server-side Razorpay order
      const orderRes = await paymentService.createOrder(booking.id);
      const orderData = orderRes.data;

      // Step 2: Open Razorpay checkout options
      const options = {
        key: orderData.key_id,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || 'INR',
        name: 'Home Services SaaS',
        description: `Payment for ${orderData.booking_reference}`,
        order_id: orderData.gateway_order_id,
        prefill: {
          name: orderData.customer_name || user?.full_name,
          email: orderData.customer_email || user?.email,
          contact: orderData.customer_phone || user?.phone,
        },
        theme: {
          color: '#2563eb',
        },
        handler: async function (response) {
          try {
            setPaymentNotice('Verifying payment signature with bank...');
            await paymentService.verifyPayment({
              booking_id: booking.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setPaymentNotice('Payment successful! Receipt recorded.');
            fetchBookings();
            setTimeout(() => setPaymentNotice(''), 4000);
          } catch (verifyErr) {
            alert(verifyErr.message || 'Signature verification failed.');
            setPaymentNotice('');
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentNotice('');
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      alert(err.message || 'Payment initiation failed.');
      setPaymentNotice('');
    }
  };

  // Review Flow
  const handleReview = (booking) => {
    setReviewBooking(booking);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    fetchBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'ACTIVE') return ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status);
    if (filter === 'COMPLETED') return b.status === 'COMPLETED';
    if (filter === 'CANCELLED') return ['CANCELLED', 'REJECTED'].includes(b.status);
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            My Appointments & Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track service visits, make payments via Razorpay, and submit verified reviews.
          </p>
        </div>
        <Link to="/services">
          <Button variant="primary" size="md">
            + Book Another Service
          </Button>
        </Link>
      </div>

      {/* Payment Notice Banner */}
      {paymentNotice && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-sm flex items-center gap-3 mb-6 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span className="font-medium">{paymentNotice}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              filter === tab
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'ALL' ? `All (${bookings.length})` : tab}
          </button>
        ))}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-center gap-3 mb-6 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-56 border border-slate-200 animate-pulse p-6" />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              isProviderView={false}
              onStatusChange={handleStatusChange}
              onPay={handlePay}
              onReview={handleReview}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No bookings in this tab</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Schedule your first home service appointment from our verified service catalog.
          </p>
          <Link to="/services">
            <Button variant="primary" size="sm" className="mt-4">
              Explore Available Services
            </Button>
          </Link>
        </div>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewBooking(null);
          }}
          booking={reviewBooking}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
