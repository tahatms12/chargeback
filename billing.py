"""
Billing Router — appSubscriptionCreate (GraphQL)
Handles all Shopify subscription status transitions idempotently.

Status mapping:
  ACTIVE    → billing_status="active", plan applied
  CANCELLED → billing_status="cancelled", plan retained until period end
  DECLINED  → billing_status="declined" (merchant declined confirmation)
  EXPIRED   → billing_status="expired"
  FROZEN    → billing_status="frozen" (Shopify partner freeze)
  PENDING   → billing_status="pending_approval"

Idempotency: keyed on shopify_billing_charge_id in accounts table.
Test mode: driven by APP_ENV, not a manual flag.
"""
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import httpx
import logging
from datetime import datetime, timezone

from app.core.config import settings
from app.core.database import get_db
from app.models import Account, Store
from app.services.auth import get_current_user, verify_webhook_hmac

router = APIRouter()
logger = logging.getLogger(__name__)

SHOPIFY_API_VERSION = "2024-10"

PLANS = {
    "starter": {
        "name": "Starter",
        "price": 39.00,
        "currency": "USD",
        "interval": "EVERY_30_DAYS",
        "trial_days": 14,
        "max_disputes": 25,
        "max_stores": 1,
    },
    "growth": {
        "name": "Growth",
        "price": 99.00,
        "currency": "USD",
        "interval": "EVERY_30_DAYS",
        "trial_days": 14,
        "max_disputes": 100,
        "max_stores": 3,
    },
    "pro": {
        "name": "Pro",
        "price": 249.00,
        "currency": "USD",
        "interval": "EVERY_30_DAYS",
        "trial_days": 14,
        "max_disputes": -1,
        "max_stores": -1,
    },
}

# Shopify subscription statuses → internal billing_status
_STATUS_MAP = {
    "ACTIVE":    "active",
    "CANCELLED": "cancelled",
    "DECLINED":  "declined",
    "EXPIRED":   "expired",
    "FROZEN":    "frozen",
    "PENDING":   "pending_approval",
}


from app.core.rate_limit import billing_limit


@router.get("/plans")
async def get_plans():
    return {"plans": PLANS}


@router.get("/current")
async def get_current_plan(request: Request, db: AsyncSession = Depends(get_db)):
    ctx = await get_current_user(request, db)
    account = await db.get(Account, uuid.UUID(ctx["account_id"]))
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    plan_key = account.plan.value if account.plan else "starter"
    return {
        "current_plan": plan_key,
        "plan_details": PLANS.get(plan_key, PLANS["starter"]),
        "billing_status": account.billing_status,
        "trial_ends_at": account.trial_ends_at.isoformat() if account.trial_ends_at else None,
        "usage": {
            "active_disputes": account.active_dispute_count or 0,
            "max_disputes": account.max_disputes_per_month,
            "active_stores": account.active_store_count or 0,
            "max_stores": account.max_stores,
        },
    }


@router.post("/upgrade/{plan}")
@billing_limit
async def upgrade_plan(plan: str, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Initiate plan upgrade.

    Simulation (BILLING_MODE=simulation):
        Directly applies plan in DB — dev/testing only.
        Never enabled when APP_ENV=production.

    Shopify (BILLING_MODE=shopify):
        Calls appSubscriptionCreate mutation.
        Returns confirmationUrl — frontend redirects merchant to approve.
        test parameter is driven by APP_ENV (never hardcoded false in production).
    """
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {plan}")

    # Simulation mode is impossible in production
    if settings.BILLING_MODE == "simulation" and settings.APP_ENV == "production":
        raise HTTPException(
            status_code=500,
            detail="BILLING_MODE=simulation is not allowed in production",
        )

    ctx = await get_current_user(request, db)
    account = await db.get(Account, uuid.UUID(ctx["account_id"]))
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if settings.BILLING_MODE == "simulation":
        from app.models import PlanTier
        account.plan = PlanTier(plan)
        account.billing_status = "active"
        account.max_disputes_per_month = PLANS[plan]["max_disputes"]
        account.max_stores = PLANS[plan]["max_stores"]
        await db.commit()
        return {"status": "upgraded", "plan": plan, "mode": "simulation"}

    # Production: real Shopify billing
    store_result = await db.execute(
        select(Store).where(Store.account_id == account.id, Store.is_active == True)
    )
    store = store_result.scalars().first()
    if not store:
        raise HTTPException(status_code=400, detail="No active store found")

    plan_info = PLANS[plan]
    is_test = settings.APP_ENV != "production"   # Test billing in non-production envs

    confirmation_url, charge_id = await _create_app_subscription(
        shop=store.shopify_domain,
        access_token=store.access_token,
        plan_name=plan_info["name"],
        price=plan_info["price"],
        currency_code=plan_info["currency"],
        interval=plan_info["interval"],
        trial_days=plan_info["trial_days"],
        return_url=f"{settings.APP_URL}/billing/confirm?plan={plan}",
        test=is_test,
    )

    # Persist the pending charge ID for idempotency
    account.shopify_billing_charge_id = charge_id
    account.billing_status = "pending_approval"
    await db.commit()

    return {
        "status": "pending_approval",
        "confirmation_url": confirmation_url,
        "charge_id": charge_id,
    }


@router.post("/webhooks/app-subscription-updated")
async def subscription_updated(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Handle Shopify app_subscriptions/update webhook.
    Idempotent — keyed on subscription ID.
    Handles ALL subscription status transitions.
    """
    body = await request.body()
    if not verify_webhook_hmac(body, request.headers.get("X-Shopify-Hmac-Sha256", "")):
        raise HTTPException(status_code=401)

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    app_sub = payload.get("app_subscription", {})
    shopify_status = app_sub.get("status", "")
    charge_id = str(app_sub.get("id", ""))
    shop = payload.get("myshopify_domain", "")

    internal_status = _STATUS_MAP.get(shopify_status)
    if not internal_status:
        logger.warning(f"Unknown subscription status {shopify_status} for {shop}")
        return {"status": "ok"}

    logger.info(f"Subscription update: shop={shop} charge={charge_id} status={shopify_status}")

    # Find account by charge_id (idempotency key) or shop
    store_result = await db.execute(select(Store).where(Store.shopify_domain == shop))
    store = store_result.scalar_one_or_none()
    if not store:
        logger.warning(f"subscription_updated: no store found for {shop}")
        return {"status": "ok"}

    account = await db.get(Account, store.account_id)
    if not account:
        return {"status": "ok"}

    # Idempotency: skip if we've already processed this charge_id with this status
    if (account.shopify_billing_charge_id == charge_id and
            account.billing_status == internal_status):
        logger.info(f"subscription_updated idempotent skip: {charge_id} already {internal_status}")
        return {"status": "ok"}

    account.shopify_billing_charge_id = charge_id
    account.billing_status = internal_status

    if shopify_status == "ACTIVE":
        account.plan_activated_at = datetime.now(timezone.utc)
        # Determine plan from price (fallback: keep existing plan if unknown)
        price = app_sub.get("line_items", [{}])[0].get("plan", {}).get(
            "pricingDetails", {}
        ).get("price", {}).get("amount")
        plan_key = _plan_from_price(price)
        if plan_key:
            from app.models import PlanTier
            account.plan = PlanTier(plan_key)
            account.max_disputes_per_month = PLANS[plan_key]["max_disputes"]
            account.max_stores = PLANS[plan_key]["max_stores"]

    await db.commit()
    logger.info(f"Account {account.id} billing updated: {internal_status}")
    return {"status": "ok"}


# ─── GraphQL billing helper ───────────────────────────────────────────────

async def _create_app_subscription(
    shop: str,
    access_token: str,
    plan_name: str,
    price: float,
    currency_code: str,
    interval: str,
    trial_days: int,
    return_url: str,
    test: bool,
) -> tuple[str, str]:
    """
    Call Shopify appSubscriptionCreate mutation.
    Returns (confirmationUrl, subscription_id).
    """
    from app.services.token_crypto import decrypt_token
    plain_token = decrypt_token(access_token)

    mutation = """
    mutation AppSubscriptionCreate(
      $name: String!, $lineItems: [AppSubscriptionLineItemInput!]!,
      $returnUrl: URL!, $trialDays: Int, $test: Boolean
    ) {
      appSubscriptionCreate(
        name: $name lineItems: $lineItems returnUrl: $returnUrl
        trialDays: $trialDays test: $test
      ) {
        appSubscription { id status }
        confirmationUrl
        userErrors { field message }
      }
    }
    """
    variables = {
        "name": f"ChargeGuard {plan_name}",
        "lineItems": [{"plan": {"appRecurringPricingDetails": {
            "price": {"amount": price, "currencyCode": currency_code},
            "interval": interval,
        }}}],
        "returnUrl": return_url,
        "trialDays": trial_days,
        "test": test,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"https://{shop}/admin/api/{SHOPIFY_API_VERSION}/graphql.json",
            headers={"X-Shopify-Access-Token": plain_token, "Content-Type": "application/json"},
            json={"query": mutation, "variables": variables},
        )
        resp.raise_for_status()
        data = resp.json()

    result = data.get("data", {}).get("appSubscriptionCreate", {})
    errors = result.get("userErrors", [])
    if errors:
        raise HTTPException(status_code=400, detail=f"Billing error: {errors[0].get('message')}")

    confirmation_url = result.get("confirmationUrl")
    charge_id = result.get("appSubscription", {}).get("id", "")
    if not confirmation_url:
        raise HTTPException(status_code=500, detail="No confirmationUrl from Shopify billing")

    return confirmation_url, charge_id


def _plan_from_price(price: str | None) -> str | None:
    if price is None:
        return None
    try:
        p = float(price)
        if p <= 39.0:   return "starter"
        if p <= 99.0:   return "growth"
        return "pro"
    except (ValueError, TypeError):
        return None
