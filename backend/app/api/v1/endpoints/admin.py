"""
Super Admin API endpoints.
All routes require SUPER_ADMIN role (enforced at router level).

Endpoints:
  GET  /admin/metrics              — platform KPIs overview
  GET  /admin/metrics/revenue-trend — daily revenue for the past N days
  GET  /admin/users                — paginated user list with filter support
  PATCH /admin/users/{user_id}/status — suspend/activate/deactivate user
  GET  /admin/providers            — paginated provider list with KYC filter
  POST /admin/providers/{provider_id}/verify — approve or reject provider KYC
  GET  /admin/reviews              — paginated review moderation queue
  POST /admin/reviews/{review_id}/moderate — approve or hide a review
  GET  /admin/services             — full service catalog with toggle
  PATCH /admin/services/{service_id}/toggle — enable/disable service listing
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.user import User, UserRole, AccountStatus, VerificationStatus
from app.models.review import ReviewModerationStatus
from app.repositories.admin_repo import admin_repository
from app.repositories.user_repo import user_repository
from app.repositories.review_repo import review_repository
from app.repositories.service_repo import service_repository
from app.schemas.common import APIResponse, PaginatedResponse
from app.schemas.admin import (
    PlatformMetrics, RevenueTrendPoint,
    AdminUserRead, AdminUserStatusUpdate,
    AdminProviderRead, ProviderVerifyRequest,
    AdminReviewRead, ReviewModerateRequest,
    AdminServiceRead, ServiceToggleRequest,
)
from app.core.exceptions import NotFoundException, AppException

router = APIRouter(
    prefix="/admin",
    tags=["Super Admin"],
    dependencies=[Depends(RoleChecker([UserRole.SUPER_ADMIN]))],
)


# ─────────────────────────── METRICS ─────────────────────────────── #

@router.get("/metrics", response_model=APIResponse[PlatformMetrics])
def get_platform_metrics(db: Session = Depends(get_db)):
    """Retrieve platform analytics and KPIs for the admin overview."""
    data = admin_repository.get_platform_metrics(db)
    return APIResponse(success=True, data=data)


@router.get("/metrics/revenue-trend", response_model=APIResponse[list])
def get_revenue_trend(
    days: int = Query(30, ge=7, le=365, description="Number of past days to include"),
    db: Session = Depends(get_db),
):
    """Daily revenue trend for the past N days (default: 30)."""
    data = admin_repository.get_revenue_trend(db, days=days)
    return APIResponse(success=True, data=data)


# ─────────────────────────── USER MANAGEMENT ─────────────────────── #

@router.get("/users", response_model=APIResponse[PaginatedResponse[AdminUserRead]])
def list_users(
    role: Optional[UserRole] = Query(None),
    status: Optional[AccountStatus] = Query(None),
    search: Optional[str] = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all platform users with optional filters and pagination."""
    skip = (page - 1) * page_size
    users, total = admin_repository.list_users(
        db, role=role, status=status, search=search, skip=skip, limit=page_size
    )
    items = [AdminUserRead.model_validate(u) for u in users]
    pages = (total + page_size - 1) // page_size
    return APIResponse(
        success=True,
        data=PaginatedResponse(items=items, total=total, page=page, pages=pages, page_size=page_size),
    )


@router.patch("/users/{user_id}/status", response_model=APIResponse[AdminUserRead])
def update_user_status(
    user_id: int,
    body: AdminUserStatusUpdate,
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Activate, suspend, or deactivate any user account."""
    if user_id == current_admin.id:
        raise AppException(status_code=400, message="Cannot change your own account status.")
    user = user_repository.get_by_id(db, user_id)
    if not user:
        raise NotFoundException("User")
    updated = admin_repository.update_user_status(db, user, body.account_status)
    return APIResponse(success=True, data=AdminUserRead.model_validate(updated), message="User status updated.")


# ─────────────────────────── PROVIDER KYC ────────────────────────── #

@router.get("/providers", response_model=APIResponse[PaginatedResponse[AdminProviderRead]])
def list_providers(
    verification_status: Optional[VerificationStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List provider profiles filtered by verification status."""
    skip = (page - 1) * page_size
    profiles, total = admin_repository.list_providers(
        db, verification_status=verification_status, skip=skip, limit=page_size
    )
    items = []
    for p in profiles:
        item = AdminProviderRead(
            id=p.id,
            user_id=p.user_id,
            business_name=p.business_name,
            legal_business_name=p.legal_business_name,
            business_registration_no=p.business_registration_no,
            tax_identifier=p.tax_identifier,
            verification_status=p.verification_status,
            verification_rejection_reason=p.verification_rejection_reason,
            is_active=p.is_active,
            average_rating=p.average_rating,
            review_count=p.review_count,
            created_at=p.created_at,
            user_full_name=p.user.full_name if p.user else None,
            user_email=p.user.email if p.user else None,
        )
        items.append(item)
    pages = (total + page_size - 1) // page_size
    return APIResponse(
        success=True,
        data=PaginatedResponse(items=items, total=total, page=page, pages=pages, page_size=page_size),
    )


@router.post("/providers/{provider_id}/verify", response_model=APIResponse[AdminProviderRead])
def verify_provider(
    provider_id: int,
    body: ProviderVerifyRequest,
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Approve or reject a provider's KYC verification submission."""
    profile = admin_repository.get_provider_profile(db, provider_id)
    if not profile:
        raise NotFoundException("ProviderProfile")

    if body.action == "approve":
        new_status = VerificationStatus.APPROVED
    elif body.action == "reject":
        if not body.rejection_reason:
            raise AppException(status_code=400, message="rejection_reason is required when rejecting.")
        new_status = VerificationStatus.REJECTED
    else:
        raise AppException(status_code=400, message="action must be 'approve' or 'reject'.")

    updated = admin_repository.verify_provider(
        db, profile, new_status, current_admin.id, body.rejection_reason
    )
    result = AdminProviderRead(
        id=updated.id,
        user_id=updated.user_id,
        business_name=updated.business_name,
        legal_business_name=updated.legal_business_name,
        business_registration_no=updated.business_registration_no,
        tax_identifier=updated.tax_identifier,
        verification_status=updated.verification_status,
        verification_rejection_reason=updated.verification_rejection_reason,
        is_active=updated.is_active,
        average_rating=updated.average_rating,
        review_count=updated.review_count,
        created_at=updated.created_at,
        user_full_name=updated.user.full_name if updated.user else None,
        user_email=updated.user.email if updated.user else None,
    )
    msg = "Provider approved." if new_status == VerificationStatus.APPROVED else "Provider rejected."
    return APIResponse(success=True, data=result, message=msg)


# ─────────────────────────── REVIEW MODERATION ───────────────────── #

@router.get("/reviews", response_model=APIResponse[PaginatedResponse[AdminReviewRead]])
def list_reviews(
    moderation_status: Optional[ReviewModerationStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List reviews for the moderation queue."""
    skip = (page - 1) * page_size
    reviews, total = admin_repository.list_reviews_for_moderation(
        db, status=moderation_status, skip=skip, limit=page_size
    )
    items = []
    for r in reviews:
        items.append(AdminReviewRead(
            id=r.id,
            booking_id=r.booking_id,
            customer_id=r.customer_id,
            provider_id=r.provider_id,
            rating=r.rating,
            review_text=r.review_text,
            moderation_status=r.moderation_status,
            created_at=r.created_at,
            customer_name=r.customer.full_name if r.customer else None,
        ))
    pages = (total + page_size - 1) // page_size
    return APIResponse(
        success=True,
        data=PaginatedResponse(items=items, total=total, page=page, pages=pages, page_size=page_size),
    )


@router.post("/reviews/{review_id}/moderate", response_model=APIResponse[AdminReviewRead])
def moderate_review(
    review_id: int,
    body: ReviewModerateRequest,
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Approve (make visible) or hide a review."""
    review = review_repository.get_by_id(db, review_id)
    if not review:
        raise NotFoundException("Review")

    if body.action == "approve":
        new_status = ReviewModerationStatus.VISIBLE
    elif body.action == "hide":
        new_status = ReviewModerationStatus.HIDDEN
    else:
        raise AppException(status_code=400, message="action must be 'approve' or 'hide'.")

    updated = admin_repository.moderate_review(db, review, new_status, current_admin.id)
    result = AdminReviewRead(
        id=updated.id,
        booking_id=updated.booking_id,
        customer_id=updated.customer_id,
        provider_id=updated.provider_id,
        rating=updated.rating,
        review_text=updated.review_text,
        moderation_status=updated.moderation_status,
        created_at=updated.created_at,
        customer_name=updated.customer.full_name if updated.customer else None,
    )
    return APIResponse(success=True, data=result, message="Review moderation status updated.")


# ─────────────────────────── SERVICE MANAGEMENT ──────────────────── #

@router.get("/services", response_model=APIResponse[PaginatedResponse[AdminServiceRead]])
def list_all_services(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List all service listings across the platform (admin view)."""
    skip = (page - 1) * page_size
    services, total = admin_repository.list_all_services(db, skip=skip, limit=page_size)
    items = []
    for s in services:
        items.append(AdminServiceRead(
            id=s.id,
            name=s.name,
            description=s.description,
            base_price=s.base_price,
            is_active=s.is_active,
            provider_id=s.provider_id,
            category_id=s.category_id,
            category_name=s.category.name if s.category else None,
            created_at=s.created_at,
        ))
    pages = (total + page_size - 1) // page_size
    return APIResponse(
        success=True,
        data=PaginatedResponse(items=items, total=total, page=page, pages=pages, page_size=page_size),
    )


@router.patch("/services/{service_id}/toggle", response_model=APIResponse[AdminServiceRead])
def toggle_service(
    service_id: int,
    body: ServiceToggleRequest,
    db: Session = Depends(get_db),
):
    """Enable or disable any service listing on the platform."""
    service = service_repository.get_service_by_id(db, service_id)
    if not service:
        raise NotFoundException("Service")
    updated = admin_repository.toggle_service_active(db, service, body.is_active)
    # Reload with relationships after toggle
    updated = service_repository.get_service_by_id(db, service_id)
    result = AdminServiceRead(
        id=updated.id,
        name=updated.name,
        description=updated.description,
        base_price=updated.base_price,
        is_active=updated.is_active,
        provider_id=updated.provider_id,
        category_id=updated.category_id,
        category_name=updated.category.name if updated.category else None,
        created_at=updated.created_at,
    )
    state = "enabled" if body.is_active else "disabled"
    return APIResponse(success=True, data=result, message=f"Service {state}.")
