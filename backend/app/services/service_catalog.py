import re
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException, ConflictException, ForbiddenException
from app.models.service import ServiceCategory, Service
from app.models.user import User, UserRole
from app.repositories.service_repo import service_repository
from app.schemas.service import CategoryCreate, ServiceCreate


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


DEFAULT_CATEGORIES = [
    {
        "name": "Plumbing Services",
        "description": "Pipe repair, drain cleaning, tap replacement, bathroom leak detection, and water heater fixes.",
    },
    {
        "name": "Electrical & Wiring",
        "description": "Fuse box fixing, switches, lighting installation, ceiling fan repair, and wiring troubleshooting.",
    },
    {
        "name": "AC & Appliance Repair",
        "description": "Air conditioner servicing, gas refilling, refrigerator, washing machine, and microwave repairs.",
    },
    {
        "name": "Home Cleaning & Sanitization",
        "description": "Deep house cleaning, kitchen scrubbing, bathroom sanitization, and sofa & carpet shampooing.",
    },
    {
        "name": "Carpentry & Furniture",
        "description": "Door & lock repair, bespoke furniture assembly, cabinet hinges, and woodwork fixes.",
    },
    {
        "name": "Painting & Waterproofing",
        "description": "Interior & exterior wall painting, damp proofing, and aesthetic wall texture finishes.",
    },
]


class ServiceCatalogService:
    def ensure_default_categories(self, db: Session) -> None:
        """Seeds initial service categories if the catalog is empty."""
        existing = service_repository.list_categories(db, active_only=False)
        if not existing:
            for cat_data in DEFAULT_CATEGORIES:
                slug = slugify(cat_data["name"])
                category = ServiceCategory(
                    name=cat_data["name"],
                    slug=slug,
                    description=cat_data["description"],
                    is_active=True,
                )
                db.add(category)
            db.commit()

    def list_categories(self, db: Session) -> List[ServiceCategory]:
        self.ensure_default_categories(db)
        return service_repository.list_categories(db, active_only=True)

    def create_category(self, db: Session, payload: CategoryCreate) -> ServiceCategory:
        slug = payload.slug or slugify(payload.name)
        if service_repository.get_category_by_slug(db, slug):
            raise ConflictException(f"Category with slug '{slug}' already exists.")

        category = ServiceCategory(
            name=payload.name,
            slug=slug,
            description=payload.description,
            is_active=payload.is_active,
        )
        return service_repository.create_category(db, category)

    def list_services(
        self,
        db: Session,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Service]:
        return service_repository.list_services(
            db=db,
            category_id=category_id,
            search=search,
            active_only=True,
            skip=skip,
            limit=limit,
        )

    def get_service_by_id(self, db: Session, service_id: int) -> Service:
        service = service_repository.get_service_by_id(db, service_id)
        if not service:
            raise NotFoundException("Service", service_id)
        return service

    def create_service(self, db: Session, user: User, payload: ServiceCreate) -> Service:
        if user.role != UserRole.PROVIDER or not user.provider_profile:
            raise ForbiddenException("Only registered Service Providers can create service listings.")

        category = service_repository.get_category_by_id(db, payload.category_id)
        if not category:
            raise NotFoundException("ServiceCategory", payload.category_id)

        service = Service(
            provider_id=user.provider_profile.id,
            category_id=payload.category_id,
            name=payload.name,
            description=payload.description,
            base_price=payload.base_price,
            estimated_duration_minutes=payload.estimated_duration_minutes,
            is_active=True,
        )
        return service_repository.create_service(db, service, image_url=payload.image_url)

    def list_provider_services(self, db: Session, user: User) -> List[Service]:
        if user.role != UserRole.PROVIDER or not user.provider_profile:
            raise ForbiddenException("User is not an active Service Provider.")
        return service_repository.list_services(
            db=db,
            provider_id=user.provider_profile.id,
            active_only=False,
            skip=0,
            limit=100,
        )


service_catalog_service = ServiceCatalogService()
