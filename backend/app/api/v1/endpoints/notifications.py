from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.common import APIResponse
from app.schemas.notification import NotificationRead, NotificationSummary
from app.services.notification_service import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=APIResponse[NotificationSummary])
def get_user_notifications(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the current user's recent notifications and unread count."""
    items, unread_count = notification_service.list_for_user(db, current_user.id, limit=limit)
    data = NotificationSummary(
        unread_count=unread_count,
        items=[NotificationRead.model_validate(n) for n in items],
    )
    return APIResponse(success=True, data=data)


@router.patch("/{notification_id}/read", response_model=APIResponse[bool])
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read."""
    success = notification_service.mark_as_read(db, notification_id, current_user.id)
    return APIResponse(success=success, data=success, message="Notification marked as read.")


@router.post("/read-all", response_model=APIResponse[int])
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications for the current user as read."""
    count = notification_service.mark_all_read(db, current_user.id)
    return APIResponse(success=True, data=count, message=f"{count} notifications marked as read.")
