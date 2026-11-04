from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel
from app.models.user import VerificationStatus
from app.schemas.service import ServiceRead
from app.schemas.review import ReviewRead
from app.schemas.availability import AvailabilitySlotRead


class ProviderPublicProfile(BaseModel):
    id: int
    user_id: int
    business_name: str
    business_description: Optional[str] = None
    verification_status: VerificationStatus
    average_rating: Decimal
    review_count: int
    created_at: datetime
    services: List[ServiceRead] = []
    reviews: List[ReviewRead] = []
    availability: List[AvailabilitySlotRead] = []

    class Config:
        from_attributes = True
