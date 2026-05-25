from __future__ import annotations
from pydantic import BaseModel, EmailStr
from datetime import datetime, date
from typing import Optional, List, Union
from enum import Enum


class NoteStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


# ==================== USER & GAMIFICATION SCHEMAS ====================

class UserBase(BaseModel):
    email: str
    username: str


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool
    xp: int = 0
    level: int = 1
    is_admin: bool = False

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class UserStatsResponse(BaseModel):
    xp: int
    level: int
    xp_to_next_level: int
    progress_percentage: float
    badges: List["BadgeResponse"]

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    id: int
    username: str
    xp: int
    level: int

    class Config:
        from_attributes = True


# Badge Schemas
class BadgeBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "🏆"
    color: str = "#FFD700"
    requirement_type: str
    requirement_value: int


class BadgeCreate(BadgeBase):
    pass


class BadgeResponse(BadgeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserBadgeResponse(BaseModel):
    id: int
    badge: BadgeResponse
    achieved_at: datetime

    class Config:
        from_attributes = True


# ==================== CATEGORY SCHEMAS ====================

class CategoryBase(BaseModel):
    name: str
    color: str = "#3498db"


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== NOTE SCHEMAS ====================

class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    date: Union[datetime, date]
    status: NoteStatus = NoteStatus.TODO
    priority: int = 1
    category_id: Optional[int] = None
    event_type: Optional[str] = None  # birthday, anniversary, holiday, special
    is_highlighted: Optional[bool] = False
    icon: Optional[str] = None
    reward_amount: Optional[float] = 0.0


class NoteCreate(NoteBase):
    pass


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    date: Optional[Union[datetime, date]] = None
    status: Optional[NoteStatus] = None
    priority: Optional[int] = None
    category_id: Optional[int] = None
    event_type: Optional[str] = None
    is_highlighted: Optional[bool] = None
    icon: Optional[str] = None
    reward_amount: Optional[float] = None


class NoteResponse(NoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True


# ==================== REMINDER SCHEMAS ====================

class ReminderBase(BaseModel):
    note_id: int
    reminder_time: datetime


class ReminderCreate(ReminderBase):
    pass


class ReminderResponse(ReminderBase):
    id: int
    user_id: int
    is_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== HABIT SCHEMAS ====================

class HabitBase(BaseModel):
    title: str
    description: Optional[str] = None
    frequency: str = "daily"
    color: str = "#4CAF50"
    icon: str = "✅"


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


class HabitResponse(HabitBase):
    id: int
    user_id: int
    current_streak: int
    longest_streak: int
    created_at: datetime
    is_completed_today: bool = False

    class Config:
        from_attributes = True


class HabitLogBase(BaseModel):
    habit_id: int
    date: date
    status: str = "done"


class HabitLogCreate(HabitLogBase):
    pass


class HabitLogResponse(HabitLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class HabitCheckInResponse(BaseModel):
    success: bool
    current_streak: int
    longest_streak: int
    xp_gained: int


# ==================== FINANCE SCHEMAS ====================

class MagicInputRequest(BaseModel):
    text: str


class TransactionCategoryBase(BaseModel):
    name: str
    icon: str = "💰"
    color: str = "#2196F3"
    type: str = "expense"


class TransactionCategoryCreate(TransactionCategoryBase):
    pass


class TransactionCategoryResponse(TransactionCategoryBase):
    id: int
    user_id: int
    is_system: bool

    class Config:
        from_attributes = True


class BudgetBase(BaseModel):
    category_id: int
    amount: float
    month: int
    year: int


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Optional[float] = None


class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime
    category: Optional[TransactionCategoryResponse] = None

    class Config:
        from_attributes = True


class DebtBase(BaseModel):
    person_name: str
    amount: float
    type: str
    notes: Optional[str] = None

class DebtCreate(DebtBase):
    pass

class DebtUpdate(BaseModel):
    person_name: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    is_settled: Optional[bool] = None
    notes: Optional[str] = None

class DebtResponse(DebtBase):
    id: int
    user_id: int
    is_settled: bool
    date: datetime

    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    title: str
    amount: float
    date: date
    note: Optional[str] = None
    category_id: Optional[int] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[date] = None
    note: Optional[str] = None
    category_id: Optional[int] = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[TransactionCategoryResponse] = None

    class Config:
        from_attributes = True


class SavingGoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_amount: float
    deadline: Optional[date] = None
    icon: str = "🎯"
    color: str = "#FF9800"


class SavingGoalCreate(SavingGoalBase):
    pass


class SavingGoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    deadline: Optional[date] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    current_amount: Optional[float] = None


class SavingGoalResponse(SavingGoalBase):
    id: int
    user_id: int
    current_amount: float
    created_at: datetime

    class Config:
        from_attributes = True


class GoalTransactionCreate(BaseModel):
    amount: float
    action: str = "deposit"  # "deposit" or "withdraw"
    note: Optional[str] = None


class FinanceSummaryResponse(BaseModel):
    total_balance: float
    total_income: float
    total_expense: float
    cash_flow_30days: List[dict]
    top_spending_categories: List[dict]


# ==================== DAILY METRIC SCHEMAS ====================

class DailyMetricBase(BaseModel):
    date: date
    metric_type: str  # mood, water, sleep, exercise
    value: str


class DailyMetricCreate(DailyMetricBase):
    pass


class DailyMetricUpdate(BaseModel):
    value: str


class DailyMetricResponse(DailyMetricBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== FOCUS SESSION SCHEMAS ====================

class FocusSessionBase(BaseModel):
    duration_minutes: int
    task_id: Optional[int] = None
    started_at: datetime


class FocusSessionCreate(FocusSessionBase):
    pass


class FocusSessionResponse(FocusSessionBase):
    id: int
    user_id: int
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class FocusSessionLogResponse(BaseModel):
    success: bool
    duration_minutes: int
    xp_gained: int


# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# XP Addition schema
class AddXPRequest(BaseModel):
    xp: int = 10
    reason: Optional[str] = None