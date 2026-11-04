import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import (
    BigInteger, String, Enum as SQLEnum, DateTime, Numeric, Text, Boolean,
    SmallInteger, ForeignKey, func, CHAR
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number: Mapped[int] = mapped_column(SmallInteger, default=1, nullable=False)
    gateway: Mapped[str] = mapped_column(String(40), default="RAZORPAY", nullable=False)
    gateway_order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    gateway_payment_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    transaction_reference: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(CHAR(3), default="INR", nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    gateway_signature_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(6), nullable=True)
    failure_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    failure_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    receipt_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(6), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(6), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    booking: Mapped["app.models.booking.Booking"] = relationship("app.models.booking.Booking")
    customer: Mapped["app.models.user.User"] = relationship("app.models.user.User")
