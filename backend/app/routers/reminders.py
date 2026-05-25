from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from ..database import get_db
from ..models import Reminder, Note
from ..schemas import ReminderCreate, ReminderResponse
from ..utils.auth import get_current_active_user
from ..config import settings


router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.get("", response_model=list[ReminderResponse])
async def get_reminders(
    skip: int = 0,
    limit: int = 100,
    upcoming: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    query = select(Reminder).filter(Reminder.user_id == current_user.id)

    if upcoming:
        query = query.filter(Reminder.reminder_time >= datetime.utcnow())

    query = query.order_by(Reminder.reminder_time.asc())
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
async def create_reminder(
    reminder_data: ReminderCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify note belongs to user
    result = await db.execute(
        select(Note).filter(Note.id == reminder_data.note_id, Note.user_id == current_user.id)
    )
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    reminder = Reminder(
        note_id=reminder_data.note_id,
        user_id=current_user.id,
        reminder_time=reminder_data.reminder_time
    )
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}")
async def delete_reminder(
    reminder_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    result = await db.execute(
        select(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
    )
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")

    await db.delete(reminder)
    await db.commit()
    return {"message": "Reminder deleted successfully"}


async def send_email_reminder(user_email: str, note_title: str, reminder_time: datetime):
    """Send email reminder to user"""
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        return  # Email not configured

    msg = MIMEMultipart()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = user_email
    msg["Subject"] = f"Reminder: {note_title}"

    body = f"""
    Xin chào,

    Đây là lời nhắc cho công việc: "{note_title}"

    Thời gian: {reminder_time.strftime('%Y-%m-%d %H:%M')}

    Bạn hãy hoàn thành công việc này nhé!
    """

    msg.attach(MIMEText(body, "plain"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_SERVER,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            use_tls=True
        )
    except Exception as e:
        print(f"Failed to send email: {e}")