import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, Enum as SQLEnum, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REASSIGNED = "REASSIGNED"


class TechnicianAssignment(Base):
    __tablename__ = "technician_assignments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    technician_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    assignment_status: Mapped[AssignmentStatus] = mapped_column(
        SQLEnum(AssignmentStatus), default=AssignmentStatus.ASSIGNED, nullable=False
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(6), server_default=func.now(), nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(6), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(6), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(6), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    booking: Mapped["app.models.booking.Booking"] = relationship("app.models.booking.Booking")
    technician: Mapped["app.models.user.User"] = relationship("app.models.user.User", foreign_keys=[technician_user_id])
