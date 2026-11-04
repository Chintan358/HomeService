from sqlalchemy.orm import Session
from app.core.exceptions import ConflictException, UnauthorizedException, AppException
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.models.user import User, UserRole, AccountStatus
from app.repositories.user_repo import user_repository
from app.schemas.auth import RegisterRequest, LoginRequest, Token
from app.schemas.user import UserRead


class AuthService:
    def register_user(self, db: Session, payload: RegisterRequest) -> User:
        # Check email duplicate
        if user_repository.get_by_email(db, payload.email):
            raise ConflictException(f"Account with email '{payload.email}' already exists.")

        # Check phone duplicate if provided
        if payload.phone and user_repository.get_by_phone(db, payload.phone):
            raise ConflictException(f"Account with phone '{payload.phone}' already exists.")

        # Validate provider-specific data
        if payload.role == UserRole.PROVIDER and not payload.business_name:
            # Fall back to user name if not supplied
            payload.business_name = f"{payload.full_name}'s Home Services"

        # Create user
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            password_hash=get_password_hash(payload.password),
            role=payload.role,
            account_status=AccountStatus.ACTIVE,
        )
        created_user = user_repository.create(db, user)

        # Attach role-specific profile
        if created_user.role == UserRole.CUSTOMER:
            user_repository.create_customer_profile(db, created_user.id)
        elif created_user.role == UserRole.PROVIDER:
            user_repository.create_provider_profile(
                db, created_user.id, business_name=payload.business_name or "Service Provider"
            )

        # Reload with joined profile
        return user_repository.get_by_id(db, created_user.id)

    def authenticate_user(self, db: Session, payload: LoginRequest) -> Token:
        user = user_repository.get_by_email(db, payload.email)
        if not user or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password.")

        if user.account_status != AccountStatus.ACTIVE:
            raise AppException(f"Account is {user.account_status.value.lower()}. Please contact support.", status_code=403)

        # Update last login timestamp
        user_repository.update_last_login(db, user)

        # Generate JWT tokens
        access_token = create_access_token(
            subject=user.id,
            extra_claims={"role": user.role.value, "email": user.email, "name": user.full_name}
        )
        refresh_token = create_refresh_token(subject=user.id)

        user_read = UserRead.model_validate(user)
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=user_read
        )


auth_service = AuthService()
