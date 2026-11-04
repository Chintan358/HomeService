from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole, AccountStatus, VerificationStatus


class CustomerProfileRead(BaseModel):
    user_id: int
    date_of_birth: Optional[date] = None
    profile_image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProviderProfileRead(BaseModel):
    id: int
    user_id: int
    business_name: str
    legal_business_name: Optional[str] = None
    business_description: Optional[str] = None
    verification_status: VerificationStatus
    is_active: bool
    average_rating: Decimal
    review_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    account_status: Optional[AccountStatus] = None


class UserRead(UserBase):
    id: int
    account_status: AccountStatus
    email_verified_at: Optional[datetime] = None
    phone_verified_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    customer_profile: Optional[CustomerProfileRead] = None
    provider_profile: Optional[ProviderProfileRead] = None

    class Config:
        from_attributes = True
