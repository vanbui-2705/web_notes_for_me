from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta, date

from ..database import get_db
from ..utils.auth import get_current_active_user
from ..models import User, Habit, HabitLog
from ..schemas import (
    HabitCreate, HabitUpdate, HabitResponse,
    HabitLogCreate, HabitLogResponse, HabitCheckInResponse
)

router = APIRouter(prefix="/habits", tags=["Habits"])


@router.get("", response_model=list[HabitResponse])
async def get_habits(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all habits for current user"""
    result = await db.execute(
        select(Habit).filter(Habit.user_id == current_user.id)
    )
    habits = result.scalars().all()
    
    # Check if logged today
    today_date = date.today()
    for habit in habits:
        log_result = await db.execute(
            select(HabitLog).filter(
                HabitLog.habit_id == habit.id,
                HabitLog.date == today_date,
                HabitLog.status == "done"
            )
        )
        habit.is_completed_today = log_result.scalar_one_or_none() is not None
        
    return habits


@router.post("", response_model=HabitResponse)
async def create_habit(
    habit_data: HabitCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new habit"""
    habit = Habit(
        title=habit_data.title,
        description=habit_data.description,
        frequency=habit_data.frequency,
        color=habit_data.color,
        icon=habit_data.icon,
        user_id=current_user.id
    )
    db.add(habit)
    await db.commit()
    await db.refresh(habit)
    return habit


@router.get("/{habit_id}", response_model=HabitResponse)
async def get_habit(
    habit_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific habit"""
    result = await db.execute(
        select(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return habit


@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: int,
    habit_data: HabitUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a habit"""
    result = await db.execute(
        select(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    update_data = habit_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(habit, field, value)

    await db.commit()
    await db.refresh(habit)
    return habit


@router.delete("/{habit_id}")
async def delete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a habit"""
    result = await db.execute(
        select(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    await db.delete(habit)
    await db.commit()
    return {"success": True, "message": "Habit deleted"}


@router.post("/{habit_id}/check", response_model=HabitCheckInResponse)
async def check_habit(
    habit_id: int,
    check_date: date | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Check off a habit for a specific date (default: today)"""
    if check_date is None:
        check_date = date.today()

    # Get habit
    result = await db.execute(
        select(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    # Check if already logged for this date
    existing_log = await db.execute(
        select(HabitLog).filter(
            HabitLog.habit_id == habit_id,
            HabitLog.date == check_date
        )
    )
    existing_log = existing_log.scalar_one_or_none()

    xp_gained = 0

    if existing_log:
        # Update existing log
        existing_log.status = "done"
        existing_log.created_at = datetime.utcnow()
    else:
        # Create new log
        log = HabitLog(
            habit_id=habit_id,
            date=check_date,
            status="done"
        )
        db.add(log)
        xp_gained = 5  # 5 XP per habit check-in

    # Calculate and update streak
    await calculate_streak(db, habit, check_date)

    await db.commit()
    await db.refresh(habit)

    return HabitCheckInResponse(
        success=True,
        current_streak=habit.current_streak,
        longest_streak=habit.longest_streak,
        xp_gained=xp_gained
    )


@router.post("/{habit_id}/uncheck")
async def uncheck_habit(
    habit_id: int,
    check_date: date | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Undo a habit check-in"""
    if check_date is None:
        check_date = date.today()

    result = await db.execute(
        select(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id)
    )
    habit = result.scalar_one_or_none()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")

    result = await db.execute(
        select(HabitLog).filter(
            HabitLog.habit_id == habit_id,
            HabitLog.date == check_date
        )
    )
    log = result.scalar_one_or_none()

    if log:
        log.status = "missed"
        await calculate_streak(db, habit, check_date)
        await db.commit()

    await db.refresh(habit)
    return {"success": True, "current_streak": habit.current_streak}


async def calculate_streak(db: AsyncSession, habit: Habit, current_date: date):
    """Calculate current and longest streak for a habit"""
    # Get all logs ordered by date
    result = await db.execute(
        select(HabitLog)
        .filter(HabitLog.habit_id == habit.id)
        .order_by(HabitLog.date.desc())
    )
    logs = result.scalars().all()

    current_streak = 0
    longest_streak = 0
    temp_streak = 0

    # Calculate from today backwards
    check_date = current_date

    for log in sorted(logs, key=lambda x: x.date, reverse=True):
        if log.status == "done":
            # Check if this date is consecutive
            if log.date == check_date or log.date == check_date - timedelta(days=1):
                temp_streak += 1
                check_date = log.date
            else:
                break
        else:
            break

    current_streak = temp_streak

    # Calculate longest streak (all time)
    temp_streak = 0
    for log in sorted(logs, key=lambda x: x.date, reverse=True):
        if log.status == "done":
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 0

    habit.current_streak = current_streak
    habit.longest_streak = longest_streak


# Cron job endpoint - call this at midnight daily to check missed habits
@router.post("/cron/check-missed")
async def check_missed_habits_cron(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Internal endpoint to mark habits as missed if not checked yesterday"""
    yesterday = date.today() - timedelta(days=1)

    habits_result = await db.execute(
        select(Habit).filter(Habit.user_id == current_user.id)
    )
    habits = habits_result.scalars().all()

    for habit in habits:
        # Check if habit has a log for yesterday
        existing_log = await db.execute(
            select(HabitLog).filter(
                HabitLog.habit_id == habit.id,
                HabitLog.date == yesterday
            )
        )
        existing_log = existing_log.scalar_one_or_none()

        if not existing_log:
            # Create missed log
            log = HabitLog(
                habit_id=habit.id,
                date=yesterday,
                status="missed"
            )
            db.add(log)
            await calculate_streak(db, habit, yesterday)

    await db.commit()
    return {"success": True, "habits_checked": len(habits)}