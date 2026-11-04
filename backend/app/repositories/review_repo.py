from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.models.review import Review, ReviewModerationStatus
from app.repositories.base import BaseRepository


class ReviewRepository(BaseRepository[Review]):
    def __init__(self):
        super().__init__(Review)

    def get_by_booking_id(self, db: Session, booking_id: int) -> Optional[Review]:
        stmt = (
            select(Review)
            .options(joinedload(Review.customer))
            .where(Review.booking_id == booking_id)
        )
        return db.scalars(stmt).first()

    def list_by_provider(
        self, db: Session, provider_id: int, skip: int = 0, limit: int = 50
    ) -> List[Review]:
        stmt = (
            select(Review)
            .options(joinedload(Review.customer))
            .where(
                Review.provider_id == provider_id,
                Review.moderation_status == ReviewModerationStatus.VISIBLE,
            )
            .order_by(Review.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(db.scalars(stmt).unique().all())


review_repository = ReviewRepository()
