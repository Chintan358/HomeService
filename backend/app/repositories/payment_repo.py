from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self):
        super().__init__(Payment)

    def get_by_booking_id(self, db: Session, booking_id: int) -> Optional[Payment]:
        stmt = select(Payment).where(Payment.booking_id == booking_id).order_by(Payment.created_at.desc())
        return db.scalars(stmt).first()

    def get_by_order_id(self, db: Session, order_id: str) -> Optional[Payment]:
        stmt = select(Payment).where(Payment.gateway_order_id == order_id)
        return db.scalars(stmt).first()

    def get_by_transaction_ref(self, db: Session, ref: str) -> Optional[Payment]:
        stmt = select(Payment).where(Payment.transaction_reference == ref)
        return db.scalars(stmt).first()


payment_repository = PaymentRepository()
