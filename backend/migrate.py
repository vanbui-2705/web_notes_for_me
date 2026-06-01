"""
Migration script to update database with new TaskFlow tables.
Run this to add new features to existing database.

Usage:
    python migrate.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import inspect, text
from app.database import engine, Base


async def run_migrations():
    """Run database migrations for TaskFlow"""
    print("🚀 Starting database migrations...")

    # Create all tables (SQLAlchemy will skip existing ones)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def get_user_columns(sync_conn):
            inspector = inspect(sync_conn)
            return {column["name"] for column in inspector.get_columns("users")}

        user_columns = await conn.run_sync(get_user_columns)
        streak_columns = {
            "current_streak": "INTEGER DEFAULT 0",
            "longest_streak": "INTEGER DEFAULT 0",
            "last_active_date": "DATE",
        }

        for column_name, column_type in streak_columns.items():
            if column_name not in user_columns:
                await conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
                print(f"Added users.{column_name}")

    print("✅ All tables created/verified successfully!")

    # Seed default badges
    from seed_badges import seed_badges
    print("\n🏅 Seeding default badges...")
    await seed_badges()

    print("\n🎉 Migrations completed successfully!")


if __name__ == "__main__":
    asyncio.run(run_migrations())
