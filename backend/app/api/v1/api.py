from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    services,
    bookings,
    providers,
    payments,
    reviews,
    admin,
    notifications,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(services.router)
api_router.include_router(bookings.router)
api_router.include_router(providers.router)
api_router.include_router(payments.router)
api_router.include_router(reviews.router)
api_router.include_router(admin.router)
api_router.include_router(notifications.router)
