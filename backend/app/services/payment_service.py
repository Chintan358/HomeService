import uuid
from datetime import datetime, timezone
from decimal import Decimal
import razorpay
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.exceptions import NotFoundException, ForbiddenException, AppException
from app.models.booking import Booking, BookingStatus, BookingStatusHistory
from app.models.payment import Payment, PaymentStatus
from app.models.user import User
from app.repositories.booking_repo import booking_repository
from app.repositories.payment_repo import payment_repository
from app.schemas.payment import (
    PaymentOrderResponse,
    PaymentVerifyRequest,
    PaymentRead,
)
from app.services.notification_service import notification_service


class PaymentService:
    def __init__(self):
        self.client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

    def create_razorpay_order(self, db: Session, user: User, booking_id: int) -> PaymentOrderResponse:
        booking = booking_repository.get_booking_by_id(db, booking_id)
        if not booking:
            raise NotFoundException("Booking", booking_id)

        if booking.customer_id != user.id:
            raise ForbiddenException("You can only pay for your own bookings.")

        if booking.status in [BookingStatus.CANCELLED, BookingStatus.REJECTED]:
            raise AppException(f"Cannot process payment for booking in {booking.status.value} status.")

        # Check if already paid
        existing_payment = payment_repository.get_by_booking_id(db, booking_id)
        if existing_payment and existing_payment.status == PaymentStatus.PAID:
            raise AppException("This booking has already been paid for.")

        # Convert to paise (e.g. 523.95 INR -> 52395 paise)
        amount_in_paise = int(booking.total_amount * 100)
        transaction_ref = f"TXN-{booking.booking_reference}-{uuid.uuid4().hex[:4].upper()}"

        # Call Razorpay API
        try:
            rzp_order = self.client.order.create({
                "amount": amount_in_paise,
                "currency": booking.currency or "INR",
                "receipt": booking.booking_reference,
                "notes": {
                    "booking_id": str(booking.id),
                    "booking_reference": booking.booking_reference,
                    "customer_email": user.email or "",
                },
            })
        except Exception as e:
            raise AppException(f"Failed to initialize payment gateway order: {str(e)}")

        order_id = rzp_order["id"]

        # Persist / update local payment record
        if existing_payment:
            payment = existing_payment
            payment.gateway_order_id = order_id
            payment.transaction_reference = transaction_ref
            payment.amount = booking.total_amount
            payment.status = PaymentStatus.PENDING
            db.add(payment)
            db.commit()
            db.refresh(payment)
        else:
            payment = Payment(
                booking_id=booking.id,
                customer_id=user.id,
                gateway="RAZORPAY",
                gateway_order_id=order_id,
                transaction_reference=transaction_ref,
                amount=booking.total_amount,
                currency=booking.currency or "INR",
                status=PaymentStatus.PENDING,
            )
            payment = payment_repository.create(db, payment)

        return PaymentOrderResponse(
            gateway_order_id=order_id,
            amount=booking.total_amount,
            currency=booking.currency or "INR",
            key_id=settings.RAZORPAY_KEY_ID,
            booking_reference=booking.booking_reference,
            customer_name=user.full_name,
            customer_email=user.email,
            customer_phone=user.phone,
        )

    def verify_payment(self, db: Session, user: User, payload: PaymentVerifyRequest) -> PaymentRead:
        payment = payment_repository.get_by_order_id(db, payload.razorpay_order_id)
        if not payment:
            raise NotFoundException("Payment for order", payload.razorpay_order_id)

        if payment.customer_id != user.id:
            raise ForbiddenException("Unauthorized to verify this payment.")

        # Verify Razorpay signature using the official SDK
        try:
            params_dict = {
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature,
            }
            self.client.utility.verify_payment_signature(params_dict)
        except Exception as e:
            payment.status = PaymentStatus.FAILED
            payment.failure_message = f"Signature verification failed: {str(e)}"
            db.add(payment)
            db.commit()
            raise AppException("Razorpay signature verification failed. Transaction was not captured.")

        # Payment successful!
        payment.status = PaymentStatus.PAID
        payment.gateway_payment_id = payload.razorpay_payment_id
        payment.gateway_signature_verified = True
        payment.paid_at = datetime.now(timezone.utc)
        db.add(payment)

        # Log status history entry on the booking
        history = BookingStatusHistory(
            booking_id=payment.booking_id,
            old_status=payment.booking.status,
            new_status=payment.booking.status,
            changed_by_user_id=user.id,
            change_note=f"Payment of {payment.amount} INR verified via Razorpay ID: {payload.razorpay_payment_id}",
        )
        db.add(history)
        db.commit()
        db.refresh(payment)

        # Notify customer & provider
        notification_service.create_notification(
            db=db,
            user_id=payment.customer_id,
            title="Payment Successful",
            message=f"Payment of ₹{payment.amount} for booking #{payment.booking.booking_reference} was successful.",
            notification_type="PAYMENT_SUCCESS",
        )
        if payment.booking and payment.booking.provider:
            notification_service.create_notification(
                db=db,
                user_id=payment.booking.provider.user_id,
                title="Payment Received",
                message=f"Received payment of ₹{payment.amount} for booking #{payment.booking.booking_reference}.",
                notification_type="PAYMENT_RECEIVED",
            )

        return PaymentRead.model_validate(payment)

    def get_payment_details(self, db: Session, user: User, booking_id: int) -> PaymentRead:
        payment = payment_repository.get_by_booking_id(db, booking_id)
        if not payment:
            raise NotFoundException("Payment for booking", booking_id)
        return PaymentRead.model_validate(payment)


payment_service = PaymentService()
