from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.user import User, UserRole
from app.models.technician import TechnicianAssignment
from app.schemas.common import APIResponse
from app.schemas.booking import BookingRead, BookingCreate, BookingStatusUpdate
from app.schemas.technician import AssignTechnicianRequest, TechnicianAssignmentRead
from app.services.booking_service import booking_service

router = APIRouter(prefix="/bookings", tags=["Bookings & Scheduling"])


@router.post("/", response_model=APIResponse[BookingRead], status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Schedule a new home service booking appointment.
    Snapshots pricing, creates address, and schedules service slot.
    """
    booking = booking_service.create_booking(db, current_user, payload)
    return APIResponse(
        success=True,
        message="Service appointment scheduled successfully.",
        data=BookingRead.model_validate(booking),
    )


@router.get("/my-bookings", response_model=APIResponse[List[BookingRead]])
def list_my_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all bookings requested by the authenticated customer."""
    bookings = booking_service.list_customer_bookings(db, current_user, skip=skip, limit=limit)
    return APIResponse(
        success=True,
        data=[BookingRead.model_validate(b) for b in bookings],
    )


@router.get("/provider-bookings", response_model=APIResponse[List[BookingRead]])
def list_provider_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(RoleChecker([UserRole.PROVIDER])),
    db: Session = Depends(get_db),
):
    """List all booking requests received by the authenticated service provider."""
    bookings = booking_service.list_provider_bookings(db, current_user, skip=skip, limit=limit)
    return APIResponse(
        success=True,
        data=[BookingRead.model_validate(b) for b in bookings],
    )


@router.get("/{booking_id}", response_model=APIResponse[BookingRead])
def get_booking_details(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full details, status timeline, and address for a specific booking."""
    booking = booking_service.get_booking(db, current_user, booking_id)
    return APIResponse(
        success=True,
        data=BookingRead.model_validate(booking),
    )


@router.patch("/{booking_id}/status", response_model=APIResponse[BookingRead])
def update_booking_status(
    booking_id: int,
    payload: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Transition booking status (ACCEPT, REJECT, IN_PROGRESS, COMPLETED, CANCELLED).
    Validates role permissions and appends to audit status history.
    """
    booking = booking_service.update_status(db, current_user, booking_id, payload)
    return APIResponse(
        success=True,
        message=f"Booking status updated to {payload.status.value}.",
        data=BookingRead.model_validate(booking),
    )


@router.post("/{booking_id}/assign-technician", response_model=APIResponse[TechnicianAssignmentRead])
def assign_technician(
    booking_id: int,
    payload: AssignTechnicianRequest,
    current_user: User = Depends(RoleChecker([UserRole.PROVIDER, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db),
):
    """Assign a qualified technician to this booking."""
    assignment = booking_service.assign_technician(
        db=db,
        user=current_user,
        booking_id=booking_id,
        technician_user_id=payload.technician_user_id,
        notes=payload.notes,
    )
    tech_user = db.get(User, assignment.technician_user_id)
    data = TechnicianAssignmentRead(
        id=assignment.id,
        booking_id=assignment.booking_id,
        provider_id=assignment.provider_id,
        technician_user_id=assignment.technician_user_id,
        assignment_status=assignment.assignment_status,
        assigned_at=assignment.assigned_at,
        notes=assignment.notes,
        technician_name=tech_user.full_name if tech_user else None,
        technician_phone=tech_user.phone if tech_user else None,
    )
    return APIResponse(success=True, data=data, message="Technician assigned successfully.")


@router.get("/{booking_id}/technician", response_model=APIResponse[Optional[TechnicianAssignmentRead]])
def get_booking_technician(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get technician assignment details for this booking."""
    assignment = db.scalar(
        select(TechnicianAssignment).where(TechnicianAssignment.booking_id == booking_id)
    )
    if not assignment:
        return APIResponse(success=True, data=None)

    tech_user = db.get(User, assignment.technician_user_id)
    data = TechnicianAssignmentRead(
        id=assignment.id,
        booking_id=assignment.booking_id,
        provider_id=assignment.provider_id,
        technician_user_id=assignment.technician_user_id,
        assignment_status=assignment.assignment_status,
        assigned_at=assignment.assigned_at,
        notes=assignment.notes,
        technician_name=tech_user.full_name if tech_user else None,
        technician_phone=tech_user.phone if tech_user else None,
    )
    return APIResponse(success=True, data=data)
