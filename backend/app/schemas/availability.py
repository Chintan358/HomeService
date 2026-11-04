from datetime import time, date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class AvailabilitySlotItem(BaseModel):
    day_of_week: int = Field(..., ge=1, le=7, description="1=Monday, 7=Sunday")
    start_time: str = Field(..., description="HH:MM format, e.g. '09:00'")
    end_time: str = Field(..., description="HH:MM format, e.g. '18:00'")
    is_available: bool = True


class AvailabilityScheduleUpdate(BaseModel):
    schedule: List[AvailabilitySlotItem]


class AvailabilitySlotRead(BaseModel):
    id: int
    provider_id: int
    day_of_week: int
    start_time: str
    end_time: str
    is_available: bool

    class Config:
        from_attributes = True


class TimeSlotOption(BaseModel):
    start_time: str
    end_time: str
    available: bool = True
