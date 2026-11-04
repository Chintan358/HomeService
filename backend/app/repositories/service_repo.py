from typing import List, Optional
from sqlalchemy import select, or_
from sqlalchemy.orm import Session, joinedload
from app.models.service import ServiceCategory, Service, ServiceImage
from app.repositories.base import BaseRepository


class ServiceRepository(BaseRepository[Service]):
    def __init__(self):
        super().__init__(Service)

    # Categories
    def list_categories(self, db: Session, active_only: bool = True) -> List[ServiceCategory]:
        stmt = select(ServiceCategory)
        if active_only:
            stmt = stmt.where(ServiceCategory.is_active == True)
        stmt = stmt.order_by(ServiceCategory.name.asc())
        return list(db.scalars(stmt).all())

    def get_category_by_id(self, db: Session, id: int) -> Optional[ServiceCategory]:
        return db.get(ServiceCategory, id)

    def get_category_by_slug(self, db: Session, slug: str) -> Optional[ServiceCategory]:
        stmt = select(ServiceCategory).where(ServiceCategory.slug == slug)
        return db.scalars(stmt).first()

    def create_category(self, db: Session, category: ServiceCategory) -> ServiceCategory:
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    # Services
    def get_service_by_id(self, db: Session, id: int) -> Optional[Service]:
        stmt = (
            select(Service)
            .options(
                joinedload(Service.category),
                joinedload(Service.provider),
                joinedload(Service.images),
            )
            .where(Service.id == id)
        )
        return db.scalars(stmt).first()

    def list_services(
        self,
        db: Session,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        provider_id: Optional[int] = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Service]:
        stmt = (
            select(Service)
            .options(
                joinedload(Service.category),
                joinedload(Service.provider),
                joinedload(Service.images),
            )
        )
        if active_only:
            stmt = stmt.where(Service.is_active == True)
        if category_id:
            stmt = stmt.where(Service.category_id == category_id)
        if provider_id:
            stmt = stmt.where(Service.provider_id == provider_id)
        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Service.name.ilike(search_term),
                    Service.description.ilike(search_term),
                )
            )

        stmt = stmt.order_by(Service.created_at.desc()).offset(skip).limit(limit)
        return list(db.scalars(stmt).unique().all())

    def create_service(
        self, db: Session, service: Service, image_url: Optional[str] = None
    ) -> Service:
        db.add(service)
        db.commit()
        db.refresh(service)

        if image_url:
            img = ServiceImage(
                service_id=service.id,
                image_url=image_url,
                alt_text=service.name,
                sort_order=0,
            )
            db.add(img)
            db.commit()

        return self.get_service_by_id(db, service.id)


service_repository = ServiceRepository()
