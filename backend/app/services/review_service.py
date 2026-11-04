from decimal import Decimal
from typing import List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException, ForbiddenException, ConflictException, AppException
from app.models.booking import Booking, BookingStatus
from app.models.review import Review, ReviewModerationStatus
from app.models.user import User, ProviderProfile
from app.repositories.booking_repo import booking_repository
from app.repositories.review_repo import review_repository
from app.schemas.review import ReviewCreate, ReviewRead


class ReviewService:
    def create_review(self, db: Session, user: User, payload: ReviewCreate) -> ReviewRead:
        booking = booking_repository.get_booking_by_id(db, payload.booking_id)
        if not booking:
            raise NotFoundException("Booking", payload.booking_id)

        if booking.customer_id != user.id:
            raise ForbiddenException("You can only submit reviews for bookings you requested.")

        if booking.status != BookingStatus.COMPLETED:
            raise AppException(f"You can only review completed service visits (current status: {booking.status.value}).")

        # Check existing review for this booking
        existing_review = review_repository.get_by_booking_id(db, payload.booking_id)
        if existing_review:
            raise ConflictException("A review has already been submitted for this booking.")

        # Create review
        review = Review(
            booking_id=booking.id,
            customer_id=user.id,
            provider_id=booking.provider_id,
            rating=payload.rating,
            review_text=payload.review_text,
            moderation_status=ReviewModerationStatus.VISIBLE,
        )
        created_review = review_repository.create(db, review)

        # Recalculate and update provider rating and review count
        self._update_provider_ratings(db, booking.provider_id)

        # Reload with relationships
        full_review = review_repository.get_by_booking_id(db, booking.id)
        return ReviewRead.model_validate(full_review)

    def _update_provider_ratings(self, db: Session, provider_id: int) -> None:
        provider = db.get(ProviderProfile, provider_id)
        if not provider:
            return

        stmt = select(
            func.avg(Review.rating),
            func.count(Review.id)
        ).where(
            Review.provider_id == provider_id,
            Review.moderation_status == ReviewModerationStatus.VISIBLE
        )
        avg_rating, count = db.execute(stmt).first()

        provider.average_rating = Decimal(str(round(avg_rating or 0.0, 2)))
        provider.review_count = count or 0
        db.add(provider)
        db.commit()

    def list_provider_reviews(self, db: Session, provider_id: int) -> List[ReviewRead]:
        reviews = review_repository.list_by_provider(db, provider_id)
        return [ReviewRead.model_validate(r) for r in reviews]

    def get_review_for_booking(self, db: Session, booking_id: int) -> Optional[ReviewRead]:
        review = review_repository.get_by_booking_id(db, booking_id)
        if not review:
            return None
        return ReviewRead.model_validate(review)


review_service = ReviewService()
