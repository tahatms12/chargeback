from app.core.config import settings


class _FakeRedis:
    async def set(self, *args, **kwargs):
        return True

    async def getdel(self, *args, **kwargs):
        return None

    async def exists(self, *args, **kwargs):
        return 0

    async def delete(self, *args, **kwargs):
        return 1


def get_redis():
    return _FakeRedis()


async def store_oauth_state(state: str, shop: str):
    r = get_redis()
    await r.set(f"oauth_state:{state}", shop, ex=600)


async def consume_oauth_state(state: str):
    r = get_redis()
    return await r.getdel(f"oauth_state:{state}")


async def invalidate_shop(shop: str):
    r = get_redis()
    await r.set(f"shop_invalidated:{shop}", "1", ex=172800)


async def is_shop_invalidated(shop: str) -> bool:
    r = get_redis()
    return bool(await r.exists(f"shop_invalidated:{shop}"))


async def clear_invalidation(shop: str):
    r = get_redis()
    await r.delete(f"shop_invalidated:{shop}")
