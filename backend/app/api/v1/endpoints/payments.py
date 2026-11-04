from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.payment import (
    PaymentCreateOrderRequest,
    PaymentOrderResponse,
    PaymentVerifyRequest,
    PaymentRead,
)
from app.services.payment_service import payment_service

router = APIRouter(prefix="/payments", tags=["Payments & Invoicing"])


@router.post("/create-order", response_model=APIResponse[PaymentOrderResponse])
def create_payment_order(
    payload: PaymentCreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Initialize a Razorpay checkout order for a booking.
    Calculates exact amounts and returns Razorpay order details.
    """
    order = payment_service.create_razorpay_order(db, current_user, payload.booking_id)
    return APIResponse(
        success=True,
        message="Payment order initialized.",
        data=order,
    )


@router.post("/verify", response_model=APIResponse[PaymentRead])
def verify_payment(
    payload: PaymentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Verify Razorpay payment signature after successful client checkout.
    Marks transaction as PAID and records audit trail.
    """
    payment = payment_service.verify_payment(db, current_user, payload)
    return APIResponse(
        success=True,
        message="Payment verified successfully.",
        data=payment,
    )


@router.get("/booking/{booking_id}", response_model=APIResponse[PaymentRead])
def get_booking_payment(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve payment receipt for a specific booking."""
    payment = payment_service.get_payment_details(db, current_user, booking_id)
    return APIResponse(
        success=True,
        data=payment,
    )
