from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from datetime import datetime, date, timedelta
from typing import List, Optional

from ..database import get_db
from ..models import Note, NoteStatus, User
from ..schemas import NoteCreate, NoteUpdate, NoteResponse, NoteStatus as NoteStatusEnum
from ..utils.auth import get_current_active_user
from .gamification import on_task_completed


router = APIRouter(prefix="/notes", tags=["Notes"])


@router.get("", response_model=List[NoteResponse])
async def get_notes(
    skip: int = 0,
    limit: int = 100,
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    status: Optional[str] = Query(None, description="Filter by status (todo, in_progress, done)"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    event_type: Optional[str] = Query(None, description="Filter by event type (birthday, anniversary, holiday, special)"),
    is_highlighted: Optional[bool] = Query(None, description="Filter by highlighted events"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    query = select(Note).filter(Note.user_id == current_user.id).options(joinedload(Note.category))

    # Apply filters
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(
                and_(
                    Note.date >= target_date,
                    Note.date < target_date + timedelta(days=1)
                )
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if status:
        try:
            note_status = NoteStatus(status)
            query = query.filter(Note.status == note_status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status. Use: todo, in_progress, done")

    if category_id:
        query = query.filter(Note.category_id == category_id)

    if event_type:
        query = query.filter(Note.event_type == event_type)

    if is_highlighted is not None:
        query = query.filter(Note.is_highlighted == is_highlighted)

    if search:
        query = query.filter(
            (Note.title.ilike(f"%{search}%")) | (Note.content.ilike(f"%{search}%"))
        )

    query = query.order_by(Note.date.desc())
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify category belongs to user if provided
    if note_data.category_id:
        from ..models import Category
        result = await db.execute(
            select(Category).filter(Category.id == note_data.category_id, Category.user_id == current_user.id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Category not found")

    note_date = note_data.date
    if isinstance(note_date, date) and not isinstance(note_date, datetime):
        note_date = datetime.combine(note_date, datetime.min.time())

    note = Note(
        title=note_data.title,
        content=note_data.content,
        date=note_date,
        status=note_data.status,
        priority=note_data.priority,
        category_id=note_data.category_id,
        user_id=current_user.id,
        event_type=note_data.event_type,
        is_highlighted=note_data.is_highlighted or False,
        icon=note_data.icon,
        reward_amount=note_data.reward_amount or 0.0
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    
    # Eager load category to return correct schema and avoid lazy-load issues
    stmt = select(Note).filter(Note.id == note.id).options(joinedload(Note.category))
    result = await db.execute(stmt)
    return result.scalar_one()


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .options(joinedload(Note.category))
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Note)
        .filter(Note.id == note_id, Note.user_id == current_user.id)
        .options(joinedload(Note.category))
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Track if task was just completed
    old_status = note.status
    new_status = note_data.status if note_data.status else old_status

    # Update fields
    update_data = note_data.model_dump(exclude_unset=True)
    if "date" in update_data and update_data["date"] is not None:
        d = update_data["date"]
        if isinstance(d, date) and not isinstance(d, datetime):
            update_data["date"] = datetime.combine(d, datetime.min.time())

    for field, value in update_data.items():
        setattr(note, field, value)

    # Award XP if task was just completed
    if old_status != NoteStatus.DONE and new_status == NoteStatus.DONE:
        await on_task_completed(db, current_user.id)
        
        if getattr(note, 'reward_amount', 0) and note.reward_amount > 0:
            from ..models import Transaction
            from datetime import date
            reward_tx = Transaction(
                title=f"Thưởng Task: {note.title}",
                amount=note.reward_amount,
                date=date.today(),
                note="Tự động cộng tiền khi hoàn thành task",
                user_id=current_user.id
            )
            db.add(reward_tx)

    await db.commit()
    await db.refresh(note)
    
    # Reload with category eager loaded
    stmt = select(Note).filter(Note.id == note.id).options(joinedload(Note.category))
    result = await db.execute(stmt)
    return result.scalar_one()


@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Note).filter(Note.id == note_id, Note.user_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    await db.delete(note)
    await db.commit()
    return {"message": "Note deleted successfully"}


@router.get("/stats/daily/{date_str}", response_model=dict)
async def get_daily_stats(
    date_str: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Get daily statistics for a specific date"""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    from sqlalchemy import func

    # Get count by status
    result = await db.execute(
        select(Note.status, func.count(Note.id))
        .filter(
            Note.user_id == current_user.id,
            func.date(Note.date) == target_date
        )
        .group_by(Note.status)
    )

    stats = {
        "date": date_str,
        "total": 0,
        "todo": 0,
        "in_progress": 0,
        "done": 0
    }

    for status_val, count in result.all():
        stats[status_val.value] = count
        stats["total"] += count

    return stats