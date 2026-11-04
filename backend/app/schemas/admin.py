"""
Admin-specific Pydantic schemas for request/response validation.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.user import UserRole, AccountStatus, VerificationStatus
from app.models.review import ReviewModerationStatus


# ------------------------------------------------------------------ #
#  Metrics                                                            #
# ------------------------------------------------------------------ #

class UserMetrics(BaseModel):
    total: int
    customers: int
    providers: int
    technicians: int
    admins: int


class BookingMetrics(BaseModel):
    total: int
    pending: int
    accepted: int
    in_progress: int
    completed: int
    cancelled: int
    completion_rate: float


class RevenueMetrics(BaseModel):
    total: float
    this_month: float


class PendingActions(BaseModel):
    provider_verifications: int
    review_moderations: int


class PlatformMetrics(BaseModel):
    users: UserMetrics
    bookings: BookingMetrics
    revenue: RevenueMetrics
    pending_actions: PendingActions


class RevenueTrendPoint(BaseModel):
    day: str
    revenue: float
    transactions: int


# ------------------------------------------------------------------ #
#  User Management                                                    #
# ------------------------------------------------------------------ #

class AdminUserRead(BaseModel):
    id: int
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole
    account_status: AccountStatus
    last_login_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserStatusUpdate(BaseModel):
    account_status: AccountStatus


# ------------------------------------------------------------------ #
#  Provider KYC                                                       #
# ------------------------------------------------------------------ #

class AdminProviderRead(BaseModel):
    id: int
    user_id: int
    business_name: str
    legal_business_name: Optional[str] = None
    business_registration_no: Optional[str] = None
    tax_identifier: Optional[str] = None
    verification_status: VerificationStatus
    verification_rejection_reason: Optional[str] = None
    is_active: bool
    average_rating: Decimal
    review_count: int
    created_at: datetime
    # nested user info
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


class ProviderVerifyRequest(BaseModel):
    action: str = Field(..., description="'approve' or 'reject'")
    rejection_reason: Optional[str] = Field(None, max_length=500)


# ------------------------------------------------------------------ #
#  Review Moderation                                                  #
# ------------------------------------------------------------------ #

class AdminReviewRead(BaseModel):
    id: int
    booking_id: int
    customer_id: int
    provider_id: int
    rating: int
    review_text: Optional[str] = None
    moderation_status: ReviewModerationStatus
    created_at: datetime
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewModerateRequest(BaseModel):
    action: str = Field(..., description="'approve' (VISIBLE) or 'hide' (HIDDEN)")


# ------------------------------------------------------------------ #
#  Service Admin                                                      #
# ------------------------------------------------------------------ #

class AdminServiceRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    base_price: Decimal
    is_active: bool
    provider_id: int
    category_id: int
    category_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ServiceToggleRequest(BaseModel):
    is_active: bool
