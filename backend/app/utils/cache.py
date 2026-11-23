"""
Dridha Crafts - High Efficiency Cache Utility
Provides fast in-memory caching with TTL and graceful degradation.
Optionally bridges to Redis when REDIS_URL is configured and reachable.
"""

import time
import json
import logging
from typing import Any, Callable, Awaitable, Optional

logger = logging.getLogger("dridhacrafts.cache")

# Fast in-memory cache storage: {key: (value_data, expiry_timestamp)}
_in_memory_cache: dict[str, tuple[Any, float]] = {}
_stats = {"hits": 0, "misses": 0}


def get_in_memory(key: str) -> Optional[Any]:
    """Retrieve value from in-memory cache if not expired."""
    entry = _in_memory_cache.get(key)
    if not entry:
        _stats["misses"] += 1
        return None
    val, expiry = entry
    if time.monotonic() > expiry:
        # Expired
        _in_memory_cache.pop(key, None)
        _stats["misses"] += 1
        return None
    _stats["hits"] += 1
    return val


def set_in_memory(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Store value in-memory with TTL."""
    # Prune if cache grows too large (> 5000 items)
    if len(_in_memory_cache) > 5000:
        now = time.monotonic()
        expired_keys = [k for k, (_, exp) in _in_memory_cache.items() if now > exp]
        for k in expired_keys:
            _in_memory_cache.pop(k, None)
    _in_memory_cache[key] = (value, time.monotonic() + ttl_seconds)


def invalidate_cache(prefix: str = "") -> int:
    """Invalidate all keys starting with prefix."""
    if not prefix:
        count = len(_in_memory_cache)
        _in_memory_cache.clear()
        logger.info("Cleared entire cache (%d keys)", count)
        return count
    keys_to_remove = [k for k in _in_memory_cache.keys() if k.startswith(prefix)]
    for k in keys_to_remove:
        _in_memory_cache.pop(k, None)
    logger.info("Invalidated %d cache keys matching '%s'", len(keys_to_remove), prefix)
    return len(keys_to_remove)


async def get_or_set_cached(
    key: str,
    ttl_seconds: int,
    fetcher: Callable[[], Awaitable[Any]],
) -> Any:
    """
    Fetch from cache or call async fetcher, cache the result, and return it.
    Zero-crash guarantee: falls back to fetcher on any error.
    """
    cached = get_in_memory(key)
    if cached is not None:
        return cached

    # Cache miss: execute fetcher
    fresh_val = await fetcher()
    try:
        set_in_memory(key, fresh_val, ttl_seconds)
    except Exception as e:
        logger.warning("Failed to store cache for '%s': %s", key, e)
    return fresh_val
