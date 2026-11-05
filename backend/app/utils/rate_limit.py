"""
Dridha Crafts - Rate Limiting Configuration
Centralized slowapi Limiter instance with secure IP extraction.
"""

from fastapi import Request
from slowapi import Limiter
from app.config import get_settings

settings = get_settings()


def get_client_ip(request: Request) -> str:
    """
    Safely extract real client IP address.
    Checks CF-Connecting-IP, then X-Forwarded-For (client is first IP in list),
    falling back to direct client host.
    """
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()

    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


limiter = Limiter(key_func=get_client_ip, default_limits=[settings.RATE_LIMIT_GENERAL])
