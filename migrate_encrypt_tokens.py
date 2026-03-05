"""
Bulk token encryption migration script.

Run ONCE before going to production (or in a maintenance window):
    python scripts/migrate_encrypt_tokens.py

Safe to re-run — skips already-encrypted rows.
Must have TOKEN_ENCRYPTION_KEY set in environment.

Rollback: set TOKEN_ENCRYPTION_KEY to the same key and re-deploy.
          Rows are never decrypted back to plaintext by this script.
          Emergency rollback: restore DB backup (keep the key used during migration).
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from app.models import Store
from app.services.token_crypto import encrypt_token, is_encrypted, validate_key_at_startup

DATABASE_URL = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set")
    sys.exit(1)


async def migrate():
    validate_key_at_startup("production")  # Hard-fail if key missing

    engine = create_async_engine(DATABASE_URL, echo=False)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        result = await db.execute(select(Store).where(Store.access_token != None))
        stores = result.scalars().all()

        migrated = 0
        skipped = 0
        errors = 0

        for store in stores:
            if not store.access_token:
                continue
            if is_encrypted(store.access_token):
                skipped += 1
                continue
            try:
                store.access_token = encrypt_token(store.access_token)
                migrated += 1
            except Exception as exc:
                print(f"ERROR encrypting store {store.shopify_domain}: {exc}")
                errors += 1

        if errors > 0:
            print(f"Aborting — {errors} errors. No changes committed.")
            await engine.dispose()
            sys.exit(1)

        await db.commit()
        print(f"Migration complete: {migrated} encrypted, {skipped} already encrypted, {errors} errors.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
