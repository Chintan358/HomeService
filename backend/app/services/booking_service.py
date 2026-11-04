import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.exceptions import NotFoundException, ForbiddenException, AppException
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole, Address, ProviderProfile, TechnicianProfile
from app.models.technician import TechnicianAssignment, AssignmentStatus
from app.repositories.booking_repo import booking_repository
from app.repositories.service_repo import service_repository
from app.schemas.booking import BookingCreate, BookingStatusUpdate
from app.services.notification_service import notification_service


def generate_booking_reference() -> str:
    now_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    short_uuid = uuid.uuid4().hex[:6].upper()
    return f"BK-{now_str}-{short_uuid}"


class BookingService:
    def create_booking(self, db: Session, user: User, payload: BookingCreate) -> Booking:
        # Check service
        service = service_repository.get_service_by_id(db, payload.service_id)
        if not service or not service.is_active:
            raise NotFoundException("Service", payload.service_id)

        # Handle Address
        address_id = payload.address_id
        if not address_id:
            if not payload.address:
                raise AppException("Delivery address is required for home services.")
            # Create address for customer
            new_address = Address(
                customer_id=user.id,
                recipient_name=payload.address.recipient_name,
                recipient_phone=payload.address.recipient_phone,
                address_line1=payload.address.address_line1,
                address_line2=payload.address.address_line2,
                landmark=payload.address.landmark,
                city=payload.address.city,
                state=payload.address.state or "Default State",
                postal_code=payload.address.postal_code,
                country_code=payload.address.country_code or "IN",
                is_default=True,
            )
            created_address = booking_repository.create_address(db, new_address)
            address_id = created_address.id

        # Calculate scheduled duration
        start_at = payload.scheduled_start_at
        end_at = start_at + timedelta(minutes=service.estimated_duration_minutes)

        # Monetary computations
        base_price = Decimal(str(service.base_price))
        tax_amount = (base_price * Decimal("0.05")).quantize(Decimal("0.01"))  # 5% service tax
        total_amount = base_price + tax_amount

        booking = Booking(
            booking_reference=generate_booking_reference(),
            idempotency_key=uuid.uuid4().hex,
            customer_id=user.id,
            provider_id=service.provider_id,
            service_id=service.id,
            address_id=address_id,
            scheduled_start_at=start_at,
            scheduled_end_at=end_at,
            problem_description=payload.problem_description,
            status=BookingStatus.PENDING,
            service_name_snapshot=service.name,
            service_price_snapshot=base_price,
            discount_amount=Decimal("0.00"),
            tax_amount=tax_amount,
            total_amount=total_amount,
            currency="INR",
        )

        saved = booking_repository.create_booking_with_history(
            db, booking, initial_note=f"Booking created for {service.name}."
        )

        # Notify Provider
        provider = db.get(ProviderProfile, service.provider_id)
        if provider:
            notification_service.create_notification(
                db=db,
                user_id=provider.user_id,
                title="New Booking Request",
                message=f"New booking #{saved.booking_reference} received for '{service.name}'.",
                notification_type="BOOKING_NEW",
            )

        return saved

    def get_booking(self, db: Session, user: User, booking_id: int) -> Booking:
        booking = booking_repository.get_booking_by_id(db, booking_id)
        if not booking:
            raise NotFoundException("Booking", booking_id)

        # Access check
        is_owner_customer = booking.customer_id == user.id
        is_owner_provider = user.provider_profile and booking.provider_id == user.provider_profile.id
        is_admin = user.role == UserRole.SUPER_ADMIN

        if not (is_owner_customer or is_owner_provider or is_admin):
            raise ForbiddenException("You do not have access to this booking.")

        return booking

    def update_status(self, db: Session, user: User, booking_id: int, payload: BookingStatusUpdate) -> Booking:
        booking = booking_repository.get_booking_by_id(db, booking_id)
        if not booking:
            raise NotFoundException("Booking", booking_id)

        is_owner_customer = booking.customer_id == user.id
        is_owner_provider = user.provider_profile and booking.provider_id == user.provider_profile.id
        is_admin = user.role == UserRole.SUPER_ADMIN

        new_status = payload.status

        # Permission & state transition rules:
        if new_status in [BookingStatus.ACCEPTED, BookingStatus.REJECTED]:
            if not (is_owner_provider or is_admin):
                raise ForbiddenException("Only the assigned service provider can accept or reject bookings.")
            if booking.status != BookingStatus.PENDING:
                raise AppException(f"Cannot transition booking from {booking.status.value} to {new_status.value}.")

        elif new_status == BookingStatus.IN_PROGRESS:
            if not (is_owner_provider or is_admin):
                raise ForbiddenException("Only the service provider can mark the job in progress.")
            if booking.status not in [BookingStatus.ACCEPTED, BookingStatus.TECHNICIAN_ASSIGNED]:
                raise AppException(f"Cannot start booking in state {booking.status.value}.")

        elif new_status == BookingStatus.COMPLETED:
            if not (is_owner_provider or is_admin):
                raise ForbiddenException("Only the service provider can complete the job.")
            if booking.status != BookingStatus.IN_PROGRESS:
                raise AppException("Booking must be IN_PROGRESS before it can be marked COMPLETED.")

        elif new_status == BookingStatus.CANCELLED:
            if not (is_owner_customer or is_owner_provider or is_admin):
                raise ForbiddenException("You do not have permission to cancel this booking.")
            if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REJECTED]:
                raise AppException(f"Cannot cancel a booking that is already {booking.status.value}.")

        updated = booking_repository.update_status(
            db=db,
            booking=booking,
            new_status=new_status,
            user_id=user.id,
            note=payload.note,
            cancellation_reason=payload.cancellation_reason,
        )

        # Notify Customer
        notif_msg = {
            BookingStatus.ACCEPTED: f"Your booking #{updated.booking_reference} has been accepted by the provider.",
            BookingStatus.REJECTED: f"Your booking #{updated.booking_reference} was declined.",
            BookingStatus.IN_PROGRESS: f"Technician has started work on booking #{updated.booking_reference}.",
            BookingStatus.COMPLETED: f"Your booking #{updated.booking_reference} is completed! Please rate your experience.",
            BookingStatus.CANCELLED: f"Booking #{updated.booking_reference} was cancelled.",
        }.get(new_status)

        if notif_msg:
            notification_service.create_notification(
                db=db,
                user_id=updated.customer_id,
                title=f"Booking {new_status.value}",
                message=notif_msg,
                notification_type=f"BOOKING_{new_status.value}",
            )

        return updated

    def assign_technician(
        self, db: Session, user: User, booking_id: int, technician_user_id: int, notes: Optional[str] = None
    ) -> TechnicianAssignment:
        booking = booking_repository.get_booking_by_id(db, booking_id)
        if not booking:
            raise NotFoundException("Booking", booking_id)

        # Check permission
        if not (user.provider_profile and booking.provider_id == user.provider_profile.id or user.role == UserRole.SUPER_ADMIN):
            raise ForbiddenException("Only the assigned provider can assign a technician.")

        # Check technician exists and belongs to this provider
        tech = db.scalar(
            select(TechnicianProfile).where(
                TechnicianProfile.user_id == technician_user_id,
                TechnicianProfile.provider_id == booking.provider_id,
            )
        )
        if not tech:
            raise AppException(status_code=400, message="Technician not found or does not belong to your business.")

        # Create or update assignment
        assignment = db.scalar(
            select(TechnicianAssignment).where(TechnicianAssignment.booking_id == booking_id)
        )
        if assignment:
            assignment.technician_user_id = technician_user_id
            assignment.notes = notes
            assignment.assignment_status = AssignmentStatus.ASSIGNED
        else:
            assignment = TechnicianAssignment(
                booking_id=booking_id,
                provider_id=booking.provider_id,
                technician_user_id=technician_user_id,
                assigned_by_user_id=user.id,
                assignment_status=AssignmentStatus.ASSIGNED,
                notes=notes,
            )
            db.add(assignment)

        # Transition booking status to TECHNICIAN_ASSIGNED if currently ACCEPTED
        if booking.status == BookingStatus.ACCEPTED:
            booking_repository.update_status(
                db=db,
                booking=booking,
                new_status=BookingStatus.TECHNICIAN_ASSIGNED,
                user_id=user.id,
                note=f"Assigned technician (user ID {technician_user_id}).",
            )

        db.commit()
        db.refresh(assignment)

        # Notify Customer and Technician
        tech_user = db.get(User, technician_user_id)
        tech_name = tech_user.full_name if tech_user else "A technician"

        notification_service.create_notification(
            db=db,
            user_id=booking.customer_id,
            title="Technician Assigned",
            message=f"{tech_name} has been assigned to your booking #{booking.booking_reference}.",
            notification_type="BOOKING_TECH_ASSIGNED",
        )
        notification_service.create_notification(
            db=db,
            user_id=technician_user_id,
            title="New Assignment",
            message=f"You have been assigned to service booking #{booking.booking_reference}.",
            notification_type="TECH_JOB_ASSIGNED",
        )

        return assignment

    def list_customer_bookings(self, db: Session, user: User, skip: int = 0, limit: int = 50) -> List[Booking]:
        return booking_repository.list_by_customer(db, customer_id=user.id, skip=skip, limit=limit)

    def list_provider_bookings(self, db: Session, user: User, skip: int = 0, limit: int = 50) -> List[Booking]:
        if user.role != UserRole.PROVIDER or not user.provider_profile:
            raise ForbiddenException("User is not registered as a service provider.")
        return booking_repository.list_by_provider(db, provider_id=user.provider_profile.id, skip=skip, limit=limit)


booking_service = BookingService()
