from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta, date

from ..database import get_db
from ..utils.auth import get_current_active_user
from ..models import User, DailyMetric, FocusSession, Note, NoteStatus
from ..schemas import (
    DailyMetricCreate, DailyMetricUpdate, DailyMetricResponse,
    FocusSessionCreate, FocusSessionResponse, FocusSessionLogResponse
)

router = APIRouter(prefix="/metrics", tags=["Daily Metrics & Focus"])


# ==================== DAILY METRICS ====================

@router.get("/daily", response_model=list[DailyMetricResponse])
async def get_daily_metrics(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    start_date: date | None = None,
    end_date: date | None = None,
    metric_type: str | None = None
):
    """Get daily metrics for current user"""
    query = select(DailyMetric).filter(DailyMetric.user_id == current_user.id)

    if start_date:
        query = query.filter(DailyMetric.date >= start_date)
    if end_date:
        query = query.filter(DailyMetric.date <= end_date)
    if metric_type:
        query = query.filter(DailyMetric.metric_type == metric_type)

    query = query.order_by(DailyMetric.date.desc(), DailyMetric.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/daily", response_model=DailyMetricResponse)
async def create_or_update_daily_metric(
    metric_data: DailyMetricCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create or update a daily metric (mood, water, sleep, etc.)"""
    # Check if already exists
    existing = await db.execute(
        select(DailyMetric).filter(
            DailyMetric.user_id == current_user.id,
            DailyMetric.date == metric_data.date,
            DailyMetric.metric_type == metric_data.metric_type
        )
    )
    existing = existing.scalar_one_or_none()

    if existing:
        # Update existing
        existing.value = metric_data.value
        existing.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return existing

    # Create new
    metric = DailyMetric(
        user_id=current_user.id,
        date=metric_data.date,
        metric_type=metric_data.metric_type,
        value=metric_data.value
    )
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return metric


@router.get("/daily/{date}/{metric_type}")
async def get_daily_metric(
    date: date,
    metric_type: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific metric for a specific date"""
    result = await db.execute(
        select(DailyMetric).filter(
            DailyMetric.user_id == current_user.id,
            DailyMetric.date == date,
            DailyMetric.metric_type == metric_type
        )
    )
    metric = result.scalar_one_or_none()

    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")

    return metric


@router.put("/daily/{metric_id}")
async def update_daily_metric(
    metric_id: int,
    metric_data: DailyMetricUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a daily metric"""
    result = await db.execute(
        select(DailyMetric).filter(
            DailyMetric.id == metric_id,
            DailyMetric.user_id == current_user.id
        )
    )
    metric = result.scalar_one_or_none()

    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")

    update_data = metric_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(metric, field, value)

    metric.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(metric)
    return metric


@router.delete("/daily/{metric_id}")
async def delete_daily_metric(
    metric_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a daily metric"""
    result = await db.execute(
        select(DailyMetric).filter(
            DailyMetric.id == metric_id,
            DailyMetric.user_id == current_user.id
        )
    )
    metric = result.scalar_one_or_none()

    if not metric:
        raise HTTPException(status_code=404, detail="Metric not found")

    await db.delete(metric)
    await db.commit()
    return {"success": True, "message": "Metric deleted"}


# ==================== FOCUS SESSIONS ====================

@router.get("/focus", response_model=list[FocusSessionResponse])
async def get_focus_sessions(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    start_date: date | None = None,
    end_date: date | None = None
):
    """Get all focus sessions for current user"""
    query = select(FocusSession).filter(FocusSession.user_id == current_user.id)

    if start_date:
        query = query.filter(func.date(FocusSession.started_at) >= start_date)
    if end_date:
        query = query.filter(func.date(FocusSession.started_at) <= end_date)

    query = query.order_by(FocusSession.started_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/focus", response_model=FocusSessionResponse)
async def create_focus_session(
    session_data: FocusSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Log a focus session"""
    session = FocusSession(
        user_id=current_user.id,
        duration_minutes=session_data.duration_minutes,
        task_id=session_data.task_id,
        started_at=session_data.started_at,
        completed_at=datetime.utcnow()
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/focus/log", response_model=FocusSessionLogResponse)
async def log_focus_session(
    duration_minutes: int,
    task_id: int | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Log a completed focus session (called when timer finishes)"""
    session = FocusSession(
        user_id=current_user.id,
        duration_minutes=duration_minutes,
        task_id=task_id,
        started_at=datetime.utcnow() - timedelta(minutes=duration_minutes),
        completed_at=datetime.utcnow()
    )
    db.add(session)

    # Calculate XP gained (1 XP per minute)
    xp_gained = duration_minutes

    # Update user XP
    current_user.xp += xp_gained

    # Update task status to in_progress if linked
    if task_id:
        task_result = await db.execute(
            select(Note).filter(Note.id == task_id, Note.user_id == current_user.id)
        )
        task = task_result.scalar_one_or_none()
        if task and task.status == NoteStatus.TODO:
            task.status = NoteStatus.IN_PROGRESS

    await db.commit()
    await db.refresh(session)

    return FocusSessionLogResponse(
        success=True,
        duration_minutes=duration_minutes,
        xp_gained=xp_gained
    )


@router.get("/focus/summary")
async def get_focus_summary(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    days: int = 7
):
    """Get focus session summary for last N days"""
    start_date = date.today() - timedelta(days=days)

    # Total minutes focused
    total_query = await db.execute(
        select(
            func.sum(FocusSession.duration_minutes).coalesce(0),
            func.count(FocusSession.id)
        ).filter(
            FocusSession.user_id == current_user.id,
            func.date(FocusSession.started_at) >= start_date
        )
    )
    total_result = total_query.first()
    total_minutes = total_result[0]
    total_sessions = total_result[1]

    # Daily breakdown
    daily_query = await db.execute(
        select(
            func.date(FocusSession.started_at).label("date"),
            func.sum(FocusSession.duration_minutes).label("minutes")
        )
        .filter(
            FocusSession.user_id == current_user.id,
            func.date(FocusSession.started_at) >= start_date
        )
        .group_by(func.date(FocusSession.started_at))
        .order_by(func.date(FocusSession.started_at))
    )
    daily_breakdown = [
        {"date": str(row.date), "minutes": row.minutes}
        for row in daily_query
    ]

    return {
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 2),
        "total_sessions": total_sessions,
        "average_minutes": round(total_minutes / total_sessions, 2) if total_sessions > 0 else 0,
        "daily_breakdown": daily_breakdown,
        "period_days": days
    }