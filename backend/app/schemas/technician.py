from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.technician import AssignmentStatus


class TechnicianCreate(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr
    phone: Optional[str] = None
    employee_code: Optional[str] = None
    skills: Optional[str] = None
    password: Optional[str] = Field("Tech@12345", description="Default password if creating user account")


class TechnicianRead(BaseModel):
    id: int
    user_id: int
    provider_id: int
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    employee_code: Optional[str] = None
    skills: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AssignTechnicianRequest(BaseModel):
    technician_user_id: int
    notes: Optional[str] = None


class TechnicianAssignmentRead(BaseModel):
    id: int
    booking_id: int
    provider_id: int
    technician_user_id: int
    assignment_status: AssignmentStatus
    assigned_at: datetime
    notes: Optional[str] = None
    technician_name: Optional[str] = None
    technician_phone: Optional[str] = None

    class Config:
        from_attributes = True
