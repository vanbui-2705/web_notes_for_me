from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum, Float, Date, Enum as SQLALEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class NoteStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

    # Gamification fields
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(Date, nullable=True)

    notes = relationship("Note", back_populates="owner", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="owner", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="owner", cascade="all, delete-orphan")

    # New relationships
    badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
    habits = relationship("Habit", back_populates="owner", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="owner", cascade="all, delete-orphan")
    saving_goals = relationship("SavingGoal", back_populates="owner", cascade="all, delete-orphan")
    daily_metrics = relationship("DailyMetric", back_populates="user", cascade="all, delete-orphan")
    focus_sessions = relationship("FocusSession", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(7), default="#3498db")  # Hex color code
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="categories")
    notes = relationship("Note", back_populates="category")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    date = Column(DateTime, nullable=False)  # Date and time of the note
    status = Column(String(20), default="todo")
    priority = Column(Integer, default=1)  # 1-5, 5 is highest
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reward_amount = Column(Float, default=0.0)  # Thưởng tiền khi hoàn thành task
    # Special day marking
    event_type = Column(String(50), nullable=True)  # birthday, anniversary, holiday, special, etc.
    is_highlighted = Column(Boolean, default=False)  # Highlight this day in calendar
    icon = Column(String(50), nullable=True)  # Emoji or icon for special events

    owner = relationship("User", back_populates="notes")
    category = relationship("Category", back_populates="notes")
    reminders = relationship("Reminder", back_populates="note", cascade="all, delete-orphan")


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reminder_time = Column(DateTime, nullable=False)
    is_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    note = relationship("Note", back_populates="reminders")
    owner = relationship("User", back_populates="reminders")


# ==================== GAMIFICATION MODELS ====================

class Badge(Base):
    """Huy hiệu có trong hệ thống"""
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)  # e.g., "Early Bird", "Streak Master"
    description = Column(Text, nullable=True)
    icon = Column(String(50), default="🏆")  # Emoji or icon name
    color = Column(String(7), default="#FFD700")  # Gold color
    requirement_type = Column(String(50), nullable=False)  # e.g., "streak", "xp", "task_complete"
    requirement_value = Column(Integer, nullable=False)  # e.g., 7 (for 7 day streak)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("UserBadge", back_populates="badge", cascade="all, delete-orphan")


class UserBadge(Base):
    """Bảng trung gian: User nào đã đạt Badge nào"""
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    achieved_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="badges")
    badge = relationship("Badge", back_populates="users")


# ==================== HABIT & STREAK MODELS ====================

class Habit(Base):
    """Thói quen hàng ngày"""
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    frequency = Column(String(20), default="daily")  # daily, weekly
    color = Column(String(7), default="#4CAF50")
    icon = Column(String(50), default="✅")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="habits")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")


class HabitLog(Base):
    """Lịch sử check habit"""
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(20), default="done")  # done, missed
    created_at = Column(DateTime, default=datetime.utcnow)

    habit = relationship("Habit", back_populates="logs")


# ==================== FINANCE MODELS ====================

class TransactionCategory(Base):
    """Danh mục giao dịch"""
    __tablename__ = "transaction_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), default="💰")
    color = Column(String(7), default="#2196F3")
    type = Column(String(20), default="expense")  # income, expense
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_system = Column(Boolean, default=False)  # System categories can't be deleted

    transactions = relationship("Transaction", back_populates="category")


class Transaction(Base):
    """Giao dịch tài chính"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    amount = Column(Float, nullable=False)  # Dương = thu nhập, Âm = chi tiêu
    date = Column(Date, nullable=False)
    note = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("transaction_categories.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="transactions")
    category = relationship("TransactionCategory", back_populates="transactions")


class SavingGoal(Base):
    """Mục tiêu tiết kiệm"""
    __tablename__ = "saving_goals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0)
    deadline = Column(Date, nullable=True)
    icon = Column(String(50), default="🎯")
    color = Column(String(7), default="#FF9800")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="saving_goals")


class Budget(Base):
    """Ngân sách cho từng danh mục"""
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("transaction_categories.id"), nullable=False)
    amount = Column(Float, nullable=False)  # Ngân sách (ví dụ 3000000)
    month = Column(Integer, nullable=False) # 1-12
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User")
    category = relationship("TransactionCategory")


class Debt(Base):
    """Sổ ghi nợ: Mượn ai, cho ai mượn"""
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    person_name = Column(String, nullable=False) # Tên người vay/cho mượn
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False) # 'borrow' (mình mượn), 'lend' (mình cho mượn)
    is_settled = Column(Boolean, default=False)
    date = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, nullable=True)
    
    owner = relationship("User")


# ==================== DAILY METRICS & FOCUS MODELS ====================

class DailyMetric(Base):
    """Chỉ số hàng ngày: tâm trạng, nước uống, v.v."""
    __tablename__ = "daily_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    metric_type = Column(String(20), nullable=False)  # mood, water, sleep, exercise
    value = Column(String(100), nullable=False)  # Lưu dưới dạng string cho linh hoạt
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="daily_metrics")

    __table_args__ = (
        # Đảm bảo mỗi user chỉ có 1 metric cho mỗi loại mỗi ngày
        # SQLAlchemy 2.0+ requires unique constraint with index
    )


class FocusSession(Base):
    """Phiên tập trung (Pomodoro)"""
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    duration_minutes = Column(Integer, nullable=False)  # Số phút đã tập trung
    task_id = Column(Integer, ForeignKey("notes.id"), nullable=True)  # Link với note/task
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="focus_sessions")
    task = relationship("Note")
