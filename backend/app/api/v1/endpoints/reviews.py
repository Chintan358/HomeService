from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.review import ReviewCreate, ReviewRead
from app.services.review_service import review_service

router = APIRouter(prefix="/reviews", tags=["Reviews & Ratings"])


@router.post("/", response_model=APIResponse[ReviewRead], status_code=status.HTTP_201_CREATED)
def submit_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit rating and review feedback for a completed service booking.
    Automatically updates the service provider's public rating and review counter.
    """
    review = review_service.create_review(db, current_user, payload)
    return APIResponse(
        success=True,
        message="Thank you! Your review has been submitted.",
        data=review,
    )


@router.get("/provider/{provider_id}", response_model=APIResponse[List[ReviewRead]])
def list_provider_reviews(
    provider_id: int,
    db: Session = Depends(get_db),
):
    """List all verified customer reviews for a service provider."""
    reviews = review_service.list_provider_reviews(db, provider_id)
    return APIResponse(
        success=True,
        data=reviews,
    )


@router.get("/booking/{booking_id}", response_model=APIResponse[Optional[ReviewRead]])
def get_booking_review(
    booking_id: int,
    db: Session = Depends(get_db),
):
    """Check if a review already exists for a specific booking."""
    review = review_service.get_review_for_booking(db, booking_id)
    return APIResponse(
        success=True,
        data=review,
    )
