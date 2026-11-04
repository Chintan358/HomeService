from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.review import ReviewModerationStatus


class ReviewCreate(BaseModel):
    booking_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    review_text: Optional[str] = Field(None, max_length=1000)


class ReviewCustomerSummary(BaseModel):
    id: int
    full_name: str

    class Config:
        from_attributes = True


class ReviewRead(BaseModel):
    id: int
    booking_id: int
    customer_id: int
    provider_id: int
    rating: int
    review_text: Optional[str] = None
    moderation_status: ReviewModerationStatus
    created_at: datetime
    customer: Optional[ReviewCustomerSummary] = None

    class Config:
        from_attributes = True
