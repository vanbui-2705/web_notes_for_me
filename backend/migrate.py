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

from sqlalchemy import text
from database import engine, Base


async def run_migrations():
    """Run database migrations for TaskFlow"""
    print("🚀 Starting database migrations...")

    # Create all tables (SQLAlchemy will skip existing ones)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("✅ All tables created/verified successfully!")

    # Seed default badges
    from seed_badges import seed_badges
    print("\n🏅 Seeding default badges...")
    await seed_badges()

    print("\n🎉 Migrations completed successfully!")


if __name__ == "__main__":
    asyncio.run(run_migrations())