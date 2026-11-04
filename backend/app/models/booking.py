import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import (
    BigInteger, String, Enum as SQLEnum, DateTime, Numeric, Text, ForeignKey, func, CHAR
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    TECHNICIAN_ASSIGNED = "TECHNICIAN_ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    booking_reference: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    idempotency_key: Mapped[str] = mapped_column(String(100), nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    provider_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("provider_profiles.id", ondelete="RESTRICT"), nullable=False, index=True)
    service_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("services.id", ondelete="RESTRICT"), nullable=False, index=True)
    address_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=False)
    scheduled_start_at: Mapped[datetime] = mapped_column(DateTime(6), nullable=False, index=True)
    scheduled_end_at: Mapped[datetime] = mapped_column(DateTime(6), nullable=False)
    problem_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[BookingStatus] = mapped_column(
        SQLEnum(BookingStatus), default=BookingStatus.PENDING, nullable=False
    )
    service_name_snapshot: Mapped[str] = mapped_column(String(180), nullable=False)
    service_price_snapshot: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(CHAR(3), default="INR", nullable=False)
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cancelled_by_user_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(6), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(6), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(6), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    customer: Mapped["app.models.user.User"] = relationship("app.models.user.User", foreign_keys=[customer_id])
    provider: Mapped["app.models.user.ProviderProfile"] = relationship("app.models.user.ProviderProfile")
    service: Mapped["app.models.service.Service"] = relationship("app.models.service.Service")
    address: Mapped["app.models.user.Address"] = relationship("app.models.user.Address")
    status_history: Mapped[List["BookingStatusHistory"]] = relationship(
        "BookingStatusHistory", back_populates="booking", cascade="all, delete-orphan", order_by="BookingStatusHistory.changed_at.desc()"
    )


class BookingStatusHistory(Base):
    __tablename__ = "booking_status_history"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status: Mapped[Optional[BookingStatus]] = mapped_column(SQLEnum(BookingStatus), nullable=True)
    new_status: Mapped[BookingStatus] = mapped_column(SQLEnum(BookingStatus), nullable=False)
    changed_by_user_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)
    change_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime(6), server_default=func.now(), nullable=False)

    booking: Mapped["Booking"] = relationship("Booking", back_populates="status_history")
