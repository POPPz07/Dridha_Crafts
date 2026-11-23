"""
Dridha Crafts - Rate Limiter
Centralized rate limiting instance to prevent brute-force attacks across authentication and admin routes.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings

settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.RATE_LIMIT_GENERAL],
)
