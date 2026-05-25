from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from ..database import get_db
from ..models import User, Note, Transaction
from ..schemas import UserResponse
from ..utils.auth import get_current_active_user

router = APIRouter(prefix="/admin", tags=["Admin Management"])


async def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    """Dependency to check if user is an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập tài nguyên này."
        )
    return current_user


@router.get("/metrics")
async def get_admin_metrics(
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get system-wide metrics for the Admin Dashboard"""
    # 1. Total users
    users_count = await db.execute(select(func.count(User.id)))
    total_users = users_count.scalar() or 0

    # 2. Active users
    active_users_count = await db.execute(select(func.count(User.id)).filter(User.is_active == True))
    total_active_users = active_users_count.scalar() or 0

    # 3. Total notes/tasks created
    notes_count = await db.execute(select(func.count(Note.id)))
    total_notes = notes_count.scalar() or 0

    # 4. Total transactions logged
    tx_count = await db.execute(select(func.count(Transaction.id)))
    total_transactions = tx_count.scalar() or 0

    return {
        "total_users": total_users,
        "total_active_users": total_active_users,
        "total_notes": total_notes,
        "total_transactions": total_transactions
    }


@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of all users with their stats (Level, XP, Notes count)"""
    result = await db.execute(
        select(User)
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    users = result.scalars().all()

    user_list = []
    for u in users:
        # Count notes for this user
        notes_res = await db.execute(select(func.count(Note.id)).filter(Note.user_id == u.id))
        notes_count = notes_res.scalar() or 0

        # Count transactions for this user
        tx_res = await db.execute(select(func.count(Transaction.id)).filter(Transaction.user_id == u.id))
        tx_count = tx_res.scalar() or 0

        user_list.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_active": u.is_active,
            "is_admin": u.is_admin,
            "xp": u.xp,
            "level": u.level,
            "created_at": u.created_at,
            "notes_count": notes_count,
            "transactions_count": tx_count
        })

    return user_list


@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle user active status (block / unblock user)"""
    # Prevent admin from blocking themselves
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự khóa tài khoản của chính mình."
        )

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "message": f"Đã {'kích hoạt' if user.is_active else 'khóa'} tài khoản thành công.",
        "is_active": user.is_active
    }


@router.put("/users/{user_id}/toggle-admin")
async def toggle_user_admin(
    user_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle user admin privilege (promote to admin / demote admin)"""
    # Prevent admin from demoting themselves
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn không thể tự gỡ quyền Admin của chính mình."
        )

    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    user.is_admin = not user.is_admin
    await db.commit()
    await db.refresh(user)

    return {
        "success": True,
        "message": f"Đã {'nâng quyền Admin' if user.is_admin else 'gỡ quyền Admin'} thành công.",
        "is_admin": user.is_admin
    }
