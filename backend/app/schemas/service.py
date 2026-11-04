from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


class ServiceCategoryImage(BaseModel):
    id: int
    image_url: str
    alt_text: Optional[str] = None
    sort_order: int

    class Config:
        from_attributes = True


class CategoryBase(BaseModel):
    name: str = Field(..., max_length=120)
    description: Optional[str] = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    slug: Optional[str] = None


class CategoryRead(CategoryBase):
    id: int
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


class ProviderSummary(BaseModel):
    id: int
    business_name: str
    verification_status: str
    average_rating: Decimal
    review_count: int

    class Config:
        from_attributes = True


class ServiceBase(BaseModel):
    name: str = Field(..., max_length=180)
    description: Optional[str] = None
    base_price: Decimal = Field(..., ge=0)
    estimated_duration_minutes: int = Field(default=60, ge=15)
    category_id: int


class ServiceCreate(ServiceBase):
    image_url: Optional[str] = None


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    base_price: Optional[Decimal] = None
    estimated_duration_minutes: Optional[int] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceRead(ServiceBase):
    id: int
    provider_id: int
    is_active: bool
    created_at: datetime
    category: Optional[CategoryRead] = None
    provider: Optional[ProviderSummary] = None
    images: List[ServiceCategoryImage] = []

    class Config:
        from_attributes = True
