"""
Seed script to create default badges in the database.
Run this after initial database setup.

Usage:
    python seed_badges.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path so we can import backend modules
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from models import Base, Badge
from database import engine


BADGES = [
    {
        "name": "Early Bird",
        "description": "Hoàn thành 5 nhiệm vụ trước 9 giờ sáng",
        "icon": "🌅",
        "color": "#FFA500",
        "requirement_type": "early_bird",
        "requirement_value": 5
    },
    {
        "name": "Streak Master",
        "description": "Duy trì streak 7 ngày liên tiếp",
        "icon": "🔥",
        "color": "#FF4500",
        "requirement_type": "streak",
        "requirement_value": 7
    },
    {
        "name": "Habit Builder",
        "description": "Duy trì streak 30 ngày liên tiếp",
        "icon": "💪",
        "color": "#FF6347",
        "requirement_type": "streak",
        "requirement_value": 30
    },
    {
        "name": "Task Slayer",
        "description": "Hoàn thành 100 nhiệm vụ",
        "icon": "⚔️",
        "color": "#DC143C",
        "requirement_type": "task_complete",
        "requirement_value": 100
    },
    {
        "name": "Productivity Ninja",
        "description": "Hoàn thành 500 nhiệm vụ",
        "icon": "🥷",
        "color": "#2F4F4F",
        "requirement_type": "task_complete",
        "requirement_value": 500
    },
    {
        "name": "XP Collector",
        "description": "Tích lũy 1000 XP",
        "icon": "⭐",
        "color": "#FFD700",
        "requirement_type": "xp",
        "requirement_value": 1000
    },
    {
        "name": "Level 10",
        "description": "Đạt cấp độ 10",
        "icon": "👑",
        "color": "#9932CC",
        "requirement_type": "level",
        "requirement_value": 10
    },
    {
        "name": "Focus Master",
        "description": "Tổng cộng 10 giờ tập trung",
        "icon": "🎯",
        "color": "#00CED1",
        "requirement_type": "focus_hours",
        "requirement_value": 10
    },
    {
        "name": "Finance Guru",
        "description": "Ghi nhận 100 giao dịch tài chính",
        "icon": "💰",
        "color": "#32CD32",
        "requirement_type": "transactions",
        "requirement_value": 100
    },
    {
        "name": "Inbox Zero",
        "description": "Không có nhiệm vụ tồn đọng",
        "icon": "📭",
        "color": "#87CEEB",
        "requirement_type": "inbox_zero",
        "requirement_value": 1
    },
]


async def seed_badges():
    """Create default badges if they don't exist"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_sessionmaker(engine, class_=AsyncSession)() as session:
        # Check existing badges
        result = await session.execute(select(Badge))
        existing_badges = {b.name: b for b in result.scalars().all()}

        created_count = 0
        for badge_data in BADGES:
            if badge_data["name"] not in existing_badges:
                badge = Badge(**badge_data)
                session.add(badge)
                print(f"✅ Created badge: {badge_data['name']} {badge_data['icon']}")
                created_count += 1
            else:
                print(f"⏭️  Badge already exists: {badge_data['name']}")

        await session.commit()

        if created_count > 0:
            print(f"\n🎉 Successfully created {created_count} badges!")
        else:
            print("\n✅ All badges already exist.")


if __name__ == "__main__":
    asyncio.run(seed_badges())