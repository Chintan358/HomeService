from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field
from app.models.payment import PaymentStatus


class PaymentCreateOrderRequest(BaseModel):
    booking_id: int


class PaymentOrderResponse(BaseModel):
    gateway_order_id: str
    amount: Decimal
    currency: str = "INR"
    key_id: str
    booking_reference: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None


class PaymentVerifyRequest(BaseModel):
    booking_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentRead(BaseModel):
    id: int
    booking_id: int
    customer_id: int
    gateway: str
    gateway_order_id: Optional[str] = None
    gateway_payment_id: Optional[str] = None
    transaction_reference: str
    amount: Decimal
    currency: str
    status: PaymentStatus
    gateway_signature_verified: bool
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
