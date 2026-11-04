from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.common import APIResponse
from app.schemas.user import UserRead
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[UserRead], status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new customer or service provider account.
    Automatically creates the corresponding CustomerProfile or ProviderProfile.
    """
    user = auth_service.register_user(db, payload)
    return APIResponse(
        success=True,
        message="Account registered successfully.",
        data=UserRead.model_validate(user),
    )


@router.post("/login", response_model=APIResponse[Token])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user credentials and issue signed JWT access & refresh tokens.
    """
    token_response = auth_service.authenticate_user(db, payload)
    return APIResponse(
        success=True,
        message="Authentication successful.",
        data=token_response,
    )


@router.get("/me", response_model=APIResponse[UserRead])
def get_current_profile(current_user: User = Depends(get_current_user)):
    """
    Retrieve authenticated user profile and nested role details using Bearer JWT.
    """
    return APIResponse(
        success=True,
        data=UserRead.model_validate(current_user),
    )
