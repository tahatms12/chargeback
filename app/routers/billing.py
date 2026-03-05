"""Billing router with explicit status mapping and plan config."""

_STATUS_MAP = {
    "ACTIVE": "active",
    "CANCELLED": "cancelled",
    "DECLINED": "declined",
    "EXPIRED": "expired",
    "FROZEN": "frozen",
    "PENDING": "pending",
}

PLANS = {
    "starter": {"name": "Starter", "price": 39.0, "currency": "USD", "interval": "EVERY_30_DAYS", "trial_days": 14, "max_disputes": 100, "max_stores": 1},
    "growth": {"name": "Growth", "price": 99.0, "currency": "USD", "interval": "EVERY_30_DAYS", "trial_days": 14, "max_disputes": 500, "max_stores": 3},
    "pro": {"name": "Pro", "price": 249.0, "currency": "USD", "interval": "EVERY_30_DAYS", "trial_days": 14, "max_disputes": 5000, "max_stores": 10},
}


def _plan_from_price(price):
    if price is None:
        return None
    p = float(price)
    if p <= 39.0:
        return "starter"
    if p <= 99.0:
        return "growth"
    return "pro"
