"""
Admin Repository — complex aggregation queries for the Super Admin panel.
Handles platform metrics, user management, provider KYC, and review moderation.
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import select, func, case, and_, text
from sqlalchemy.orm import Session, joinedload

from app.models.user import User, UserRole, AccountStatus, ProviderProfile, VerificationStatus
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.models.review import Review, ReviewModerationStatus
from app.models.service import ServiceCategory, Service


class AdminRepository:
    # ------------------------------------------------------------------ #
    #  Platform Metrics                                                   #
    # ------------------------------------------------------------------ #

    def get_platform_metrics(self, db: Session) -> dict:
        """Aggregate KPIs for the admin overview dashboard."""
        # User counts by role
        user_counts = db.execute(
            select(User.role, func.count(User.id).label("cnt"))
            .group_by(User.role)
        ).all()
        role_map = {row.role: row.cnt for row in user_counts}

        # Total revenue (PAID payments)
        total_revenue_row = db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0).label("rev"))
            .where(Payment.status == PaymentStatus.PAID)
        ).first()
        total_revenue = float(total_revenue_row.rev) if total_revenue_row else 0.0

        # Revenue this month
        first_of_month = datetime.now(timezone.utc).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        monthly_rev_row = db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0).label("rev"))
            .where(
                and_(
                    Payment.status == PaymentStatus.PAID,
                    Payment.paid_at >= first_of_month,
                )
            )
        ).first()
        monthly_revenue = float(monthly_rev_row.rev) if monthly_rev_row else 0.0

        # Booking counts by status
        booking_counts = db.execute(
            select(Booking.status, func.count(Booking.id).label("cnt"))
            .group_by(Booking.status)
        ).all()
        booking_map = {row.status: row.cnt for row in booking_counts}

        # Providers pending verification
        pending_providers = db.scalar(
            select(func.count(ProviderProfile.id))
            .where(ProviderProfile.verification_status == VerificationStatus.PENDING)
        ) or 0

        # Reviews pending moderation
        pending_reviews = db.scalar(
            select(func.count(Review.id))
            .where(Review.moderation_status == ReviewModerationStatus.PENDING)
        ) or 0

        total_bookings = sum(booking_map.values())
        completed = booking_map.get(BookingStatus.COMPLETED, 0)

        return {
            "users": {
                "total": sum(role_map.values()),
                "customers": role_map.get(UserRole.CUSTOMER, 0),
                "providers": role_map.get(UserRole.PROVIDER, 0),
                "technicians": role_map.get(UserRole.TECHNICIAN, 0),
                "admins": role_map.get(UserRole.SUPER_ADMIN, 0),
            },
            "bookings": {
                "total": total_bookings,
                "pending": booking_map.get(BookingStatus.PENDING, 0),
                "accepted": booking_map.get(BookingStatus.ACCEPTED, 0),
                "in_progress": booking_map.get(BookingStatus.IN_PROGRESS, 0),
                "completed": completed,
                "cancelled": booking_map.get(BookingStatus.CANCELLED, 0),
                "completion_rate": round((completed / total_bookings * 100), 1) if total_bookings else 0.0,
            },
            "revenue": {
                "total": total_revenue,
                "this_month": monthly_revenue,
            },
            "pending_actions": {
                "provider_verifications": pending_providers,
                "review_moderations": pending_reviews,
            },
        }

    def get_revenue_trend(self, db: Session, days: int = 30) -> List[dict]:
        """Daily revenue for the past N days."""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        rows = db.execute(
            select(
                func.date(Payment.paid_at).label("day"),
                func.coalesce(func.sum(Payment.amount), 0).label("revenue"),
                func.count(Payment.id).label("transactions"),
            )
            .where(
                and_(
                    Payment.status == PaymentStatus.PAID,
                    Payment.paid_at >= since,
                )
            )
            .group_by(func.date(Payment.paid_at))
            .order_by(func.date(Payment.paid_at))
        ).all()
        return [
            {"day": str(row.day), "revenue": float(row.revenue), "transactions": row.transactions}
            for row in rows
        ]

    # ------------------------------------------------------------------ #
    #  User Management                                                    #
    # ------------------------------------------------------------------ #

    def list_users(
        self,
        db: Session,
        role: Optional[UserRole] = None,
        status: Optional[AccountStatus] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 25,
    ) -> Tuple[List[User], int]:
        """Filtered, paginated user list with total count."""
        base = (
            select(User)
            .options(
                joinedload(User.customer_profile),
                joinedload(User.provider_profile),
            )
        )
        count_base = select(func.count(User.id))

        filters = []
        if role:
            filters.append(User.role == role)
        if status:
            filters.append(User.account_status == status)
        if search:
            pattern = f"%{search}%"
            filters.append(
                (User.full_name.ilike(pattern)) | (User.email.ilike(pattern))
            )

        if filters:
            from sqlalchemy import and_
            combined = and_(*filters)
            base = base.where(combined)
            count_base = count_base.where(combined)

        total = db.scalar(count_base) or 0
        users = list(
            db.scalars(base.order_by(User.created_at.desc()).offset(skip).limit(limit)).unique().all()
        )
        return users, total

    def update_user_status(self, db: Session, user: User, new_status: AccountStatus) -> User:
        """Activate, suspend, or deactivate a user account."""
        user.account_status = new_status
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    # ------------------------------------------------------------------ #
    #  Provider KYC Verification                                         #
    # ------------------------------------------------------------------ #

    def list_providers(
        self,
        db: Session,
        verification_status: Optional[VerificationStatus] = None,
        skip: int = 0,
        limit: int = 25,
    ) -> Tuple[List[ProviderProfile], int]:
        """Paginated provider profiles filtered by verification status."""
        base = (
            select(ProviderProfile)
            .options(joinedload(ProviderProfile.user))
        )
        count_base = select(func.count(ProviderProfile.id))

        if verification_status:
            base = base.where(ProviderProfile.verification_status == verification_status)
            count_base = count_base.where(ProviderProfile.verification_status == verification_status)

        total = db.scalar(count_base) or 0
        profiles = list(
            db.scalars(base.order_by(ProviderProfile.created_at.desc()).offset(skip).limit(limit)).unique().all()
        )
        return profiles, total

    def get_provider_profile(self, db: Session, provider_id: int) -> Optional[ProviderProfile]:
        """Get a single provider profile by its PK (not user_id)."""
        stmt = (
            select(ProviderProfile)
            .options(joinedload(ProviderProfile.user))
            .where(ProviderProfile.id == provider_id)
        )
        return db.scalars(stmt).first()

    def verify_provider(
        self,
        db: Session,
        profile: ProviderProfile,
        new_status: VerificationStatus,
        admin_id: int,
        rejection_reason: Optional[str] = None,
    ) -> ProviderProfile:
        """Approve or reject a provider KYC submission."""
        profile.verification_status = new_status
        profile.verified_by_admin_id = admin_id
        profile.verified_at = datetime.now(timezone.utc)
        if rejection_reason:
            profile.verification_rejection_reason = rejection_reason
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    # ------------------------------------------------------------------ #
    #  Review Moderation                                                  #
    # ------------------------------------------------------------------ #

    def list_reviews_for_moderation(
        self,
        db: Session,
        status: Optional[ReviewModerationStatus] = None,
        skip: int = 0,
        limit: int = 25,
    ) -> Tuple[List[Review], int]:
        """Paginated reviews for the moderation queue."""
        base = select(Review).options(joinedload(Review.customer))
        count_base = select(func.count(Review.id))

        if status:
            base = base.where(Review.moderation_status == status)
            count_base = count_base.where(Review.moderation_status == status)

        total = db.scalar(count_base) or 0
        reviews = list(
            db.scalars(base.order_by(Review.created_at.desc()).offset(skip).limit(limit)).unique().all()
        )
        return reviews, total

    def moderate_review(
        self,
        db: Session,
        review: Review,
        new_status: ReviewModerationStatus,
        admin_id: int,
    ) -> Review:
        """Set a review's moderation status (VISIBLE / HIDDEN)."""
        review.moderation_status = new_status
        review.moderated_by_admin_id = admin_id
        review.moderated_at = datetime.now(timezone.utc)
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    # ------------------------------------------------------------------ #
    #  Service Catalog Management                                        #
    # ------------------------------------------------------------------ #

    def list_all_services(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Service], int]:
        """Full service list with booking count per service for admin view."""
        total = db.scalar(select(func.count(Service.id))) or 0
        services = list(
            db.scalars(
                select(Service)
                .options(joinedload(Service.category))
                .order_by(Service.created_at.desc())
                .offset(skip)
                .limit(limit)
            ).unique().all()
        )
        return services, total

    def toggle_service_active(self, db: Session, service: Service, is_active: bool) -> Service:
        """Enable or disable a service listing."""
        service.is_active = is_active
        db.add(service)
        db.commit()
        db.refresh(service)
        return service


admin_repository = AdminRepository()
