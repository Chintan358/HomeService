import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    BigInteger, SmallInteger, Text, DateTime, ForeignKey, func, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class ReviewModerationStatus(str, enum.Enum):
    VISIBLE = "VISIBLE"
    HIDDEN = "HIDDEN"
    PENDING = "PENDING"


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    review_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    moderation_status: Mapped[ReviewModerationStatus] = mapped_column(
        SQLEnum(ReviewModerationStatus), default=ReviewModerationStatus.VISIBLE, nullable=False
    )
    moderated_by_admin_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)
    moderated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(6), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(6), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(6), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    booking: Mapped["app.models.booking.Booking"] = relationship("app.models.booking.Booking")
    customer: Mapped["app.models.user.User"] = relationship("app.models.user.User", foreign_keys=[customer_id])
    provider: Mapped["app.models.user.ProviderProfile"] = relationship("app.models.user.ProviderProfile")
