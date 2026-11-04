from datetime import datetime
from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationSummary(BaseModel):
    unread_count: int
    items: list[NotificationRead]
