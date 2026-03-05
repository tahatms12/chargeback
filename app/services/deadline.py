from datetime import datetime, timezone


def calculate_urgency(deadline: datetime) -> str:
    now = datetime.now(timezone.utc)
    delta = deadline - now
    if delta.total_seconds() < 0:
        return "overdue"
    if delta.total_seconds() <= 24 * 3600:
        return "due_today"
    if delta.days <= 3:
        return "due_3days"
    return "later"
