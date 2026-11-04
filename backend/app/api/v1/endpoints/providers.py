from datetime import time, datetime
from typing import List, Optional
import bcrypt
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.user import User, UserRole, ProviderProfile, TechnicianProfile, VerificationStatus
from app.models.service import Service
from app.models.review import Review, ReviewModerationStatus
from app.models.availability import ProviderAvailability
from app.schemas.common import APIResponse
from app.schemas.provider import ProviderPublicProfile
from app.schemas.availability import (
    AvailabilitySlotRead, AvailabilityScheduleUpdate, TimeSlotOption
)
from app.schemas.technician import TechnicianCreate, TechnicianRead
from app.schemas.service import ServiceRead
from app.schemas.review import ReviewRead
from app.core.exceptions import AppException, NotFoundException

router = APIRouter(prefix="/providers", tags=["Providers"])


# ─────────────────────────────────────────────────────────────────────────────
# 1. Public Provider List & Profile
# ─────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=APIResponse[List[dict]])
def list_providers(
    db: Session = Depends(get_db),
    verified_only: bool = True,
):
    """List service providers with public info and ratings."""
    stmt = select(ProviderProfile).options(joinedload(ProviderProfile.user))
    if verified_only:
        stmt = stmt.where(ProviderProfile.verification_status == VerificationStatus.APPROVED)
    stmt = stmt.where(ProviderProfile.is_active == True)
    
    profiles = db.scalars(stmt).unique().all()
    data = [
        {
            "id": p.id,
            "user_id": p.user_id,
            "business_name": p.business_name,
            "business_description": p.business_description,
            "average_rating": float(p.average_rating),
            "review_count": p.review_count,
            "verification_status": p.verification_status,
        }
        for p in profiles
    ]
    return APIResponse(success=True, data=data)


@router.get("/{provider_id}/profile", response_model=APIResponse[ProviderPublicProfile])
def get_provider_profile(provider_id: int, db: Session = Depends(get_db)):
    """Get full public profile of a provider including active services, reviews, and working hours."""
    provider = db.get(ProviderProfile, provider_id)
    if not provider:
        raise NotFoundException("Provider")

    # Fetch active services
    services = db.scalars(
        select(Service)
        .options(joinedload(Service.category), joinedload(Service.images))
        .where(Service.provider_id == provider_id, Service.is_active == True)
    ).unique().all()

    # Fetch reviews
    reviews = db.scalars(
        select(Review)
        .options(joinedload(Review.customer))
        .where(Review.provider_id == provider_id, Review.moderation_status == ReviewModerationStatus.VISIBLE)
        .order_by(Review.created_at.desc())
        .limit(20)
    ).unique().all()

    # Fetch availability schedule
    avail = db.scalars(
        select(ProviderAvailability)
        .where(ProviderAvailability.provider_id == provider_id)
        .order_by(ProviderAvailability.day_of_week.asc())
    ).all()

    profile = ProviderPublicProfile(
        id=provider.id,
        user_id=provider.user_id,
        business_name=provider.business_name,
        business_description=provider.business_description,
        verification_status=provider.verification_status,
        average_rating=provider.average_rating,
        review_count=provider.review_count,
        created_at=provider.created_at,
        services=[ServiceRead.model_validate(s) for s in services],
        reviews=[ReviewRead.model_validate(r) for r in reviews],
        availability=[
            AvailabilitySlotRead(
                id=a.id,
                provider_id=a.provider_id,
                day_of_week=a.day_of_week,
                start_time=a.start_time.strftime("%H:%M"),
                end_time=a.end_time.strftime("%H:%M"),
                is_available=a.is_available,
            )
            for a in avail
        ],
    )
    return APIResponse(success=True, data=profile)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Provider Availability & Time Slots
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/me/availability", response_model=APIResponse[List[AvailabilitySlotRead]])
def get_my_availability(
    current_user: User = Depends(RoleChecker([UserRole.PROVIDER])),
    db: Session = Depends(get_db),
):
    """Get the logged-in provider's weekly availability schedule."""
    if not current_user.provider_profile:
        raise AppException(status_code=400, message="Provider profile not found.")
    
    slots = db.scalars(
        select(ProviderAvailability)
        .where(ProviderAvailability.provider_id == current_user.provider_profile.id)
        .order_by(ProviderAvailability.day_of_week.asc())
    ).all()

    data = [
        AvailabilitySlotRead(
            id=s.id,
            provider_id=s.provider_id,
            day_of_week=s.day_of_week,
            start_time=s.start_time.strftime("%H:%M"),
            end_time=s.end_time.strftime("%H:%M"),
            is_available=s.is_available,
        )
        for s in slots
    ]
    return APIResponse(success=True, data=data)


@router.put("/me/availability", response_model=APIResponse[List[AvailabilitySlotRead]])
def update_my_availability(
    body: AvailabilityScheduleUpdate,
    current_user: User = Depends(RoleChecker([UserRole.PROVIDER])),
    db: Session = Depends(get_db),
):
    """Replace weekly availability schedule for the logged-in provider."""
    if not current_user.provider_profile:
        raise AppException(status_code=400, message="Provider profile not found.")

    provider_id = current_user.provider_profile.id

    # Delete existing slots
    db.execute(
        delete(ProviderAvailability).where(ProviderAvailability.provider_id == provider_id)
    )

    created_slots = []
    for item in body.schedule:
        try:
            sh, sm = map(int, item.start_time.split(":"))
            eh, em = map(int, item.end_time.split(":"))
            st = time(hour=sh, minute=sm)
            et = time(hour=eh, minute=em)
        except Exception:
            raise AppException(status_code=400, message=f"Invalid time format in schedule for day {item.day_of_week}")

        slot = ProviderAvailability(
            provider_id=provider_id,
            day_of_week=item.day_of_week,
            start_time=st,
            end_time=et,
            is_available=item.is_available,
        )
        db.add(slot)
        created_slots.append(slot)

    db.commit()

    data = [
        AvailabilitySlotRead(
            id=s.id,
            provider_id=s.provider_id,
            day_of_week=s.day_of_week,
            start_time=s.start_time.strftime("%H:%M"),
            end_time=s.end_time.strftime("%H:%M"),
            is_available=s.is_available,
        )
        for s in created_slots
    ]
    return APIResponse(success=True, data=data, message="Schedule updated successfully.")


@router.get("/{provider_id}/slots", response_model=APIResponse[List[TimeSlotOption]])
def get_provider_available_slots(
    provider_id: int,
    date_str: str = Query(..., alias="date", description="Target date in YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """Compute available 1-hour time slots for a provider on a given date."""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise AppException(status_code=400, message="Invalid date format, use YYYY-MM-DD.")

    # 1 = Monday, 7 = Sunday in Python isoweekday()
    dow = target_date.isoweekday()

    avail = db.scalars(
        select(ProviderAvailability).where(
            ProviderAvailability.provider_id == provider_id,
            ProviderAvailability.day_of_week == dow,
            ProviderAvailability.is_available == True,
        )
    ).first()

    # If provider hasn't set custom hours, default to 09:00 - 18:00
    start_hour = avail.start_time.hour if avail else 9
    end_hour = avail.end_time.hour if avail else 18

    # Generate 1-hour slots
    slots = []
    for h in range(start_hour, end_hour):
        slots.append(
            TimeSlotOption(
                start_time=f"{h:02d}:00",
                end_time=f"{h+1:02d}:00",
                available=True,
            )
        )

    return APIResponse(success=True, data=slots)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Technician Management
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/me/technicians", response_model=APIResponse[List[TechnicianRead]])
def list_my_technicians(
    current_user: User = Depends(RoleChecker([UserRole.PROVIDER])),
    db: Session = Depends(get_db),
):
    """List all technicians under the logged-in provider."""
    if not current_user.provider_profile:
        raise AppException(status_code=400, message="Provider profile not found.")

    provider_id = current_user.provider_profile.id
    techs = db.scalars(
        select(TechnicianProfile)
        .options(joinedload(TechnicianProfile.user))
        .where(TechnicianProfile.provider_id == provider_id)
        .order_by(TechnicianProfile.created_at.desc())
    ).all()

    data = [
        TechnicianRead(
            id=t.id,
            user_id=t.user_id,
            provider_id=t.provider_id,
            full_name=t.user.full_name,
            email=t.user.email,
            phone=t.user.phone,
            employee_code=t.employee_code,
            skills=t.skills,
            is_active=t.is_active,
            created_at=t.created_at,
        )
        for t in techs
    ]
    return APIResponse(success=True, data=data)


@router.post("/me/technicians", response_model=APIResponse[TechnicianRead])
def add_technician(
    body: TechnicianCreate,
    current_user: User = Depends(RoleChecker([UserRole.PROVIDER])),
    db: Session = Depends(get_db),
):
    """Create a new technician user account and associate with this provider."""
    if not current_user.provider_profile:
        raise AppException(status_code=400, message="Provider profile not found.")

    provider_id = current_user.provider_profile.id

    # Check email duplicate
    existing_user = db.scalar(select(User).where(User.email == body.email))
    if existing_user:
        raise AppException(status_code=409, message="A user with this email already exists.")

    pw_hash = bcrypt.hashpw(body.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    new_user = User(
        full_name=body.full_name,
        email=body.email,
        phone=body.phone,
        role=UserRole.TECHNICIAN,
        password_hash=pw_hash,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    tech_profile = TechnicianProfile(
        user_id=new_user.id,
        provider_id=provider_id,
        employee_code=body.employee_code,
        skills=body.skills,
        is_active=True,
    )
    db.add(tech_profile)
    db.commit()
    db.refresh(tech_profile)

    res = TechnicianRead(
        id=tech_profile.id,
        user_id=new_user.id,
        provider_id=provider_id,
        full_name=new_user.full_name,
        email=new_user.email,
        phone=new_user.phone,
        employee_code=tech_profile.employee_code,
        skills=tech_profile.skills,
        is_active=tech_profile.is_active,
        created_at=tech_profile.created_at,
    )
    return APIResponse(success=True, data=res, message="Technician added successfully.")
