import React, { useState, useEffect } from 'react';
import BookingStatusBadge from './BookingStatusBadge';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Briefcase,
  FileText,
  CheckCircle2,
  PlayCircle,
  XCircle,
  CreditCard,
  Star,
  Check,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { paymentService } from '../../services/paymentService';
import { reviewService } from '../../services/reviewService';
import { getBookingTechnician } from '../../services/providerService';
import AssignTechnicianModal from './AssignTechnicianModal';

export default function BookingCard({
  booking,
  isProviderView = false,
  onStatusChange,
  onPay,
  onReview,
}) {
  const {
    id,
    booking_reference,
    status,
    scheduled_start_at,
    total_amount,
    service_name_snapshot,
    problem_description,
    address,
    customer,
    provider,
    status_history,
  } = booking;

  const [payment, setPayment] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [technician, setTechnician] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const fetchTech = () => {
    getBookingTechnician(id)
      .then((data) => setTechnician(data))
      .catch(() => setTechnician(null));
  };

  useEffect(() => {
    // Check payment status
    paymentService
      .getPaymentDetails(id)
      .then((res) => setPayment(res.data))
      .catch(() => setPayment(null));

    // Fetch assigned technician
    fetchTech();

    // If completed, check if review already submitted
    if (status === 'COMPLETED') {
      reviewService
        .getBookingReview(id)
        .then((res) => setExistingReview(res.data))
        .catch(() => setExistingReview(null));
    }
  }, [id, status]);

  const dateObj = new Date(scheduled_start_at);
  const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isPaid = payment?.status === 'PAID';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-slate-400">
                #{booking_reference}
              </span>
              <BookingStatusBadge status={status} />
              {isPaid ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3 h-3" /> Paid (Razorpay)
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Unpaid
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              {service_name_snapshot}
            </h3>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
            <span className="text-lg font-extrabold text-blue-600">
              {formatCurrency(total_amount)}
            </span>
          </div>
        </div>

        {/* Schedule Info */}
        <div className="grid grid-cols-2 gap-4 py-3 text-xs bg-slate-50/70 rounded-xl px-3 my-4">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{formatDate(scheduled_start_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{timeFormatted}</span>
          </div>
        </div>

        {/* Parties details */}
        <div className="space-y-2 text-xs text-slate-600 mb-4">
          {isProviderView ? (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Customer:</strong> {customer?.full_name} ({customer?.phone || customer?.email})
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Provider:</strong> {provider?.business_name || 'Verified Provider'}
              </span>
            </div>
          )}

          {address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                {address.address_line1}, {address.city} - {address.postal_code}
              </span>
            </div>
          )}

          {problem_description && (
            <div className="flex items-start gap-2 pt-1 text-slate-500 italic">
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>"{problem_description}"</span>
            </div>
          )}

          {/* Assigned Technician Banner */}
          {technician && (
            <div className="bg-blue-50/60 border border-blue-200/80 p-2.5 rounded-lg text-xs flex items-center justify-between text-blue-900 mt-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-800">Technician:</span>
                <span className="font-medium">{technician.technician_name || `Tech #${technician.technician_user_id}`}</span>
                {technician.technician_phone && (
                  <span className="text-blue-600">({technician.technician_phone})</span>
                )}
              </div>
              <Badge variant="blue" className="text-[10px]">{technician.assignment_status}</Badge>
            </div>
          )}

          {/* Show review summary if reviewed */}
          {existingReview && (
            <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl">
              <div className="flex items-center gap-1 text-amber-700 font-bold text-xs mb-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Your Rating: {existingReview.rating}/5</span>
              </div>
              <p className="text-xs text-slate-600 italic">"{existingReview.review_text}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] text-slate-400">
          Ref: {booking_reference}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Provider Actions */}
          {isProviderView && status === 'PENDING' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => onStatusChange && onStatusChange(id, 'REJECTED')}
              >
                Decline
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onStatusChange && onStatusChange(id, 'ACCEPTED')}
              >
                Accept Job
              </Button>
            </>
          )}

          {isProviderView && (status === 'ACCEPTED' || status === 'TECHNICIAN_ASSIGNED') && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50 flex items-center gap-1.5"
                onClick={() => setShowAssignModal(true)}
              >
                <User className="w-3.5 h-3.5" />
                {technician ? "Reassign Tech" : "Assign Tech"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
                onClick={() => onStatusChange && onStatusChange(id, 'IN_PROGRESS')}
              >
                <PlayCircle className="w-3.5 h-3.5" /> Start Job
              </Button>
            </>
          )}

          {isProviderView && status === 'IN_PROGRESS' && (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
              onClick={() => onStatusChange && onStatusChange(id, 'COMPLETED')}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
            </Button>
          )}

          {/* Customer Actions */}
          {!isProviderView && (
            <>
              {/* Pay Now Button via Razorpay */}
              {!isPaid && !['CANCELLED', 'REJECTED'].includes(status) && (
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
                  onClick={() => onPay && onPay(booking)}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay with Razorpay
                </Button>
              )}

              {/* Review Button for Completed Unreviewed Bookings */}
              {status === 'COMPLETED' && !existingReview && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 flex items-center gap-1.5"
                  onClick={() => onReview && onReview(booking)}
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Leave Review
                </Button>
              )}

              {/* Cancel Button */}
              {['PENDING', 'ACCEPTED'].includes(status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
                  onClick={() => onStatusChange && onStatusChange(id, 'CANCELLED')}
                >
                  <XCircle className="w-3.5 h-3.5" /> Cancel
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {showAssignModal && (
        <AssignTechnicianModal
          booking={booking}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            fetchTech();
            onStatusChange && onStatusChange(id, 'TECHNICIAN_ASSIGNED');
          }}
        />
      )}
    </div>
  );
}
