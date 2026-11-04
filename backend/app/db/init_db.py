import logging
from sqlalchemy.orm import Session
from app.db.base import Base
from app.db.session import engine

logger = logging.getLogger(__name__)


def init_db(db: Session) -> None:
    """Initialize database tables and initial seed data if needed."""
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema initialized.")
