from datetime import date, timedelta

from ..models import User


def touch_daily_streak(user: User, today: date | None = None) -> bool:
    """Update the user's app activity streak once per calendar day."""
    today = today or date.today()

    if user.last_active_date == today:
        return False

    if user.last_active_date == today - timedelta(days=1):
        user.current_streak = (user.current_streak or 0) + 1
    else:
        user.current_streak = 1

    user.longest_streak = max(user.longest_streak or 0, user.current_streak)
    user.last_active_date = today
    return True


def get_streak_tier(current_streak: int) -> str:
    if current_streak >= 100:
        return "legend"
    if current_streak >= 30:
        return "blaze"
    if current_streak >= 7:
        return "hot"
    return "spark"
