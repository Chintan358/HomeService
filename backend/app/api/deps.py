from typing import Generator, List
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import decode_token
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.repositories.user_repo import user_repository
from app.schemas.auth import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Generator[Session, None, None]:
    """Provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    """Validates JWT access token and returns currently authenticated user."""
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException("Could not validate credentials.")
        token_data = TokenPayload(sub=user_id, role=payload.get("role"), email=payload.get("email"))
    except jwt.PyJWTError:
        raise UnauthorizedException("Invalid or expired authentication credentials.")

    user = user_repository.get_by_id(db, id=int(token_data.sub))
    if not user:
        raise UnauthorizedException("User not found.")
    return user


class RoleChecker:
    """Dependency for checking required user roles."""
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise ForbiddenException("Access forbidden: Insufficient permissions.")
        return current_user
