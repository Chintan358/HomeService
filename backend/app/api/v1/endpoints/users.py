from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, RoleChecker
from app.models.user import UserRole
from app.repositories.user_repo import user_repository
from app.schemas.common import APIResponse
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/",
    response_model=APIResponse[List[UserRead]],
    dependencies=[Depends(RoleChecker([UserRole.SUPER_ADMIN]))]
)
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    List all platform users with role profiles. (Restricted to SUPER_ADMIN role).
    """
    users = user_repository.list_all(db, skip=skip, limit=limit)
    return APIResponse(
        success=True,
        data=[UserRead.model_validate(u) for u in users]
    )
