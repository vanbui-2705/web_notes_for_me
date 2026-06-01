from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from ..database import get_db
from ..utils.auth import get_current_active_user
from ..models import User, Badge, UserBadge, Note, NoteStatus
from ..schemas import LeaderboardEntry, AddXPRequest
from ..utils.streak import get_streak_tier, touch_daily_streak

router = APIRouter(prefix="/users", tags=["Gamification"])


def calculate_level(xp: int) -> int:
    """Calculate level based on XP. Formula: level 1 = 0 XP, level 2 = 100 XP, etc."""
    return int(xp / 100) + 1


def calculate_xp_to_next_level(level: int) -> int:
    """Calculate XP needed to reach next level."""
    next_level_xp = level * 100
    current_level_xp = (level - 1) * 100
    return next_level_xp - current_level_xp


def calculate_progress_percentage(xp: int, level: int) -> float:
    """Calculate progress percentage to next level."""
    current_level_xp = (level - 1) * 100
    next_level_xp = level * 100
    progress = xp - current_level_xp
    total_for_level = next_level_xp - current_level_xp
    return round((progress / total_for_level) * 100, 2)


@router.get("/me/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's gamification stats: XP, level, badges"""
    from ..schemas import BadgeResponse

    if touch_daily_streak(current_user):
        await db.commit()
        await db.refresh(current_user)

    # Get user's badges
    result = await db.execute(
        select(UserBadge).filter(UserBadge.user_id == current_user.id)
    )
    user_badges = result.scalars().all()

    badge_list = []
    for ub in user_badges:
        badge_list.append(BadgeResponse(
            id=ub.badge.id,
            name=ub.badge.name,
            description=ub.badge.description,
            icon=ub.badge.icon,
            color=ub.badge.color,
            requirement_type=ub.badge.requirement_type,
            requirement_value=ub.badge.requirement_value,
            created_at=ub.badge.created_at
        ))

    return {
        "xp": current_user.xp,
        "level": current_user.level,
        "xp_to_next_level": calculate_xp_to_next_level(current_user.level),
        "progress_percentage": calculate_progress_percentage(current_user.xp, current_user.level),
        "current_streak": current_user.current_streak or 0,
        "longest_streak": current_user.longest_streak or 0,
        "last_active_date": current_user.last_active_date,
        "streak_tier": get_streak_tier(current_user.current_streak or 0),
        "badges": badge_list
    }


@router.post("/me/add-xp")
async def add_xp(
    request: AddXPRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add XP to current user (called automatically when completing tasks)"""
    old_level = current_user.level
    current_user.xp += request.xp
    current_user.level = calculate_level(current_user.xp)

    # Check for level up
    level_up = current_user.level > old_level

    # Check for badge achievements
    await check_badge_achievements(db, current_user)

    await db.commit()
    await db.refresh(current_user)

    return {
        "success": True,
        "xp_added": request.xp,
        "total_xp": current_user.xp,
        "level": current_user.level,
        "level_up": level_up,
        "reason": request.reason or "Task completed"
    }


async def check_badge_achievements(db: AsyncSession, user: User):
    """Check if user has achieved any new badges"""
    # Get all badges user doesn't have yet
    result = await db.execute(
        select(Badge).where(
            ~Badge.id.in_(
                select(UserBadge.badge_id).where(UserBadge.user_id == user.id)
            )
        )
    )
    available_badges = result.scalars().all()

    for badge in available_badges:
        should_award = False

        # Check streak badge
        if badge.requirement_type == "streak":
            if (user.current_streak or 0) >= badge.requirement_value:
                should_award = True

        # Check task completion badge
        elif badge.requirement_type == "task_complete":
            tasks_completed = await db.execute(
                select(func.count(Note.id)).where(
                    Note.user_id == user.id,
                    Note.status == NoteStatus.DONE
                )
            )
            if tasks_completed.scalar() >= badge.requirement_value:
                should_award = True

        # Check XP badge
        elif badge.requirement_type == "xp":
            if user.xp >= badge.requirement_value:
                should_award = True

        # Award badge if criteria met
        if should_award:
            user_badge = UserBadge(
                user_id=user.id,
                badge_id=badge.id
            )
            db.add(user_badge)

    await db.commit()


@router.get("/me/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 10
):
    """Get leaderboard of top users by XP"""
    result = await db.execute(
        select(User)
        .where(User.is_active == True)
        .order_by(User.xp.desc())
        .offset(skip)
        .limit(limit)
    )
    users = result.scalars().all()

    return [
        LeaderboardEntry(
            id=user.id,
            username=user.username,
            xp=user.xp,
            level=user.level
        )
        for user in users
    ]


# System service function to call when a note is marked as done
async def on_task_completed(db: AsyncSession, user_id: int):
    """Called when a user completes a task - awards XP"""
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if user:
        old_level = user.level
        user.xp += 10  # 10 XP per completed task
        user.level = calculate_level(user.xp)
        await db.commit()
        await db.refresh(user)

        await check_badge_achievements(db, user)

        return {
            "xp_gained": 10,
            "total_xp": user.xp,
            "level": user.level,
            "level_up": user.level > old_level
        }
    return None
