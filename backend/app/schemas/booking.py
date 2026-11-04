from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.booking import BookingStatus


class AddressCreate(BaseModel):
    recipient_name: str
    recipient_phone: str
    address_line1: str
    address_line2: Optional[str] = None
    landmark: Optional[str] = None
    city: str
    state: Optional[str] = "State"
    postal_code: str
    country_code: str = "IN"


class AddressRead(AddressCreate):
    id: int

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    service_id: int
    scheduled_start_at: datetime
    problem_description: Optional[str] = None
    address_id: Optional[int] = None
    # If no address_id, create address on the fly:
    address: Optional[AddressCreate] = None


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    note: Optional[str] = None
    cancellation_reason: Optional[str] = None


class BookingStatusHistoryRead(BaseModel):
    id: int
    old_status: Optional[BookingStatus] = None
    new_status: BookingStatus
    changed_by_user_id: Optional[int] = None
    change_note: Optional[str] = None
    changed_at: datetime

    class Config:
        from_attributes = True


class BookingCustomerSummary(BaseModel):
    id: int
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class BookingProviderSummary(BaseModel):
    id: int
    business_name: str
    average_rating: Decimal

    class Config:
        from_attributes = True


class BookingServiceSummary(BaseModel):
    id: int
    name: str
    base_price: Decimal
    estimated_duration_minutes: int

    class Config:
        from_attributes = True


class BookingRead(BaseModel):
    id: int
    booking_reference: str
    status: BookingStatus
    customer_id: int
    provider_id: int
    service_id: int
    address_id: int
    scheduled_start_at: datetime
    scheduled_end_at: datetime
    problem_description: Optional[str] = None
    service_name_snapshot: str
    service_price_snapshot: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    currency: str
    cancellation_reason: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    customer: Optional[BookingCustomerSummary] = None
    provider: Optional[BookingProviderSummary] = None
    service: Optional[BookingServiceSummary] = None
    address: Optional[AddressRead] = None
    status_history: List[BookingStatusHistoryRead] = []

    class Config:
        from_attributes = True
