from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, RoleChecker
from app.models.user import User, UserRole
from app.schemas.common import APIResponse
from app.schemas.service import (
    CategoryRead,
    CategoryCreate,
    ServiceRead,
    ServiceCreate,
)
from app.services.service_catalog import service_catalog_service

router = APIRouter(prefix="/services", tags=["Services & Catalog"])


# --- Categories ---

@router.get("/categories", response_model=APIResponse[List[CategoryRead]])
def list_categories(db: Session = Depends(get_db)):
    """List all active service categories."""
    categories = service_catalog_service.list_categories(db)
    return APIResponse(
        success=True,
        data=[CategoryRead.model_validate(c) for c in categories],
    )


@router.post(
    "/categories",
    response_model=APIResponse[CategoryRead],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RoleChecker([UserRole.SUPER_ADMIN]))],
)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    """Create a new service category (Super Admin only)."""
    category = service_catalog_service.create_category(db, payload)
    return APIResponse(
        success=True,
        message="Category created successfully.",
        data=CategoryRead.model_validate(category),
    )


# --- Services ---

@router.get("/", response_model=APIResponse[List[ServiceRead]])
def list_services(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search query for service name or description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Browse published services with optional search and category filters."""
    services = service_catalog_service.list_services(
        db, category_id=category_id, search=search, skip=skip, limit=limit
    )
    return APIResponse(
        success=True,
        data=[ServiceRead.model_validate(s) for s in services],
    )


@router.get("/provider/my-services", response_model=APIResponse[List[ServiceRead]])
def get_my_provider_services(
    current_user: User = Depends(RoleChecker([UserRole.PROVIDER])),
    db: Session = Depends(get_db),
):
    """Retrieve all service listings created by the currently authenticated Provider."""
    services = service_catalog_service.list_provider_services(db, current_user)
    return APIResponse(
        success=True,
        data=[ServiceRead.model_validate(s) for s in services],
    )


@router.get("/{service_id}", response_model=APIResponse[ServiceRead])
def get_service_details(service_id: int, db: Session = Depends(get_db)):
    """Retrieve detailed information about a specific service listing."""
    service = service_catalog_service.get_service_by_id(db, service_id)
    return APIResponse(
        success=True,
        data=ServiceRead.model_validate(service),
    )


@router.post("/", response_model=APIResponse[ServiceRead], status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreate,
    current_user: User = Depends(RoleChecker([UserRole.PROVIDER])),
    db: Session = Depends(get_db),
):
    """Publish a new service listing (Service Providers only)."""
    service = service_catalog_service.create_service(db, current_user, payload)
    return APIResponse(
        success=True,
        message="Service published successfully.",
        data=ServiceRead.model_validate(service),
    )
