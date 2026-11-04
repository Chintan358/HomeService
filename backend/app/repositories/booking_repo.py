from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.models.booking import Booking, BookingStatus, BookingStatusHistory
from app.models.user import Address
from app.repositories.base import BaseRepository


class BookingRepository(BaseRepository[Booking]):
    def __init__(self):
        super().__init__(Booking)

    def create_address(self, db: Session, address: Address) -> Address:
        db.add(address)
        db.commit()
        db.refresh(address)
        return address

    def get_address_by_id(self, db: Session, address_id: int) -> Optional[Address]:
        return db.get(Address, address_id)

    def get_booking_by_id(self, db: Session, id: int) -> Optional[Booking]:
        stmt = (
            select(Booking)
            .options(
                joinedload(Booking.customer),
                joinedload(Booking.provider),
                joinedload(Booking.service),
                joinedload(Booking.address),
                joinedload(Booking.status_history),
            )
            .where(Booking.id == id)
        )
        return db.scalars(stmt).first()

    def get_booking_by_reference(self, db: Session, reference: str) -> Optional[Booking]:
        stmt = (
            select(Booking)
            .options(
                joinedload(Booking.customer),
                joinedload(Booking.provider),
                joinedload(Booking.service),
                joinedload(Booking.address),
                joinedload(Booking.status_history),
            )
            .where(Booking.booking_reference == reference)
        )
        return db.scalars(stmt).first()

    def list_by_customer(self, db: Session, customer_id: int, skip: int = 0, limit: int = 50) -> List[Booking]:
        stmt = (
            select(Booking)
            .options(
                joinedload(Booking.customer),
                joinedload(Booking.provider),
                joinedload(Booking.service),
                joinedload(Booking.address),
                joinedload(Booking.status_history),
            )
            .where(Booking.customer_id == customer_id)
            .order_by(Booking.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.scalars(stmt).unique().all())

    def list_by_provider(self, db: Session, provider_id: int, skip: int = 0, limit: int = 50) -> List[Booking]:
        stmt = (
            select(Booking)
            .options(
                joinedload(Booking.customer),
                joinedload(Booking.provider),
                joinedload(Booking.service),
                joinedload(Booking.address),
                joinedload(Booking.status_history),
            )
            .where(Booking.provider_id == provider_id)
            .order_by(Booking.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.scalars(stmt).unique().all())

    def create_booking_with_history(self, db: Session, booking: Booking, initial_note: Optional[str] = None) -> Booking:
        db.add(booking)
        db.commit()
        db.refresh(booking)

        history = BookingStatusHistory(
            booking_id=booking.id,
            old_status=None,
            new_status=booking.status,
            changed_by_user_id=booking.customer_id,
            change_note=initial_note or "Booking request created.",
        )
        db.add(history)
        db.commit()

        return self.get_booking_by_id(db, booking.id)

    def update_status(
        self,
        db: Session,
        booking: Booking,
        new_status: BookingStatus,
        user_id: int,
        note: Optional[str] = None,
        cancellation_reason: Optional[str] = None,
    ) -> Booking:
        old_status = booking.status
        booking.status = new_status
        if cancellation_reason:
            booking.cancellation_reason = cancellation_reason
            booking.cancelled_by_user_id = user_id
        if new_status == BookingStatus.COMPLETED:
            booking.completed_at = datetime.now(timezone.utc)

        db.add(booking)

        history = BookingStatusHistory(
            booking_id=booking.id,
            old_status=old_status,
            new_status=new_status,
            changed_by_user_id=user_id,
            change_note=note or f"Status transitioned from {old_status.value} to {new_status.value}",
        )
        db.add(history)
        db.commit()

        return self.get_booking_by_id(db, booking.id)


booking_repository = BookingRepository()
