from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.models.user import User, CustomerProfile, ProviderProfile, VerificationStatus
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_id(self, db: Session, id: int) -> Optional[User]:
        stmt = (
            select(User)
            .options(
                joinedload(User.customer_profile),
                joinedload(User.provider_profile),
            )
            .where(User.id == id)
        )
        return db.scalars(stmt).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(
                joinedload(User.customer_profile),
                joinedload(User.provider_profile),
            )
            .where(User.email == email)
        )
        return db.scalars(stmt).first()

    def get_by_phone(self, db: Session, phone: str) -> Optional[User]:
        stmt = select(User).where(User.phone == phone)
        return db.scalars(stmt).first()

    def update_last_login(self, db: Session, user: User) -> None:
        user.last_login_at = datetime.now(timezone.utc)
        db.add(user)
        db.commit()

    def create_customer_profile(self, db: Session, user_id: int) -> CustomerProfile:
        profile = CustomerProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    def create_provider_profile(self, db: Session, user_id: int, business_name: str) -> ProviderProfile:
        profile = ProviderProfile(
            user_id=user_id,
            business_name=business_name,
            verification_status=VerificationStatus.PENDING,
            is_active=True,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    def list_all(self, db: Session, skip: int = 0, limit: int = 20) -> List[User]:
        stmt = (
            select(User)
            .options(
                joinedload(User.customer_profile),
                joinedload(User.provider_profile),
            )
            .offset(skip)
            .limit(limit)
            .order_by(User.created_at.desc())
        )
        return list(db.scalars(stmt).unique().all())


user_repository = UserRepository()
