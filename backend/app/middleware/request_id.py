"""
Dridha Crafts - Request ID & Structured Access Logging Middleware
Attaches unique X-Request-ID to each request/response and logs structured JSON metrics.
"""

import time
import uuid
import json
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("dridhacrafts.access")


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate short 8-char unique request ID or use client header if provided
        incoming_id = request.headers.get("X-Request-ID")
        request_id = incoming_id if incoming_id else uuid.uuid4().hex[:8]
        request.state.request_id = request_id

        start_time = time.monotonic()
        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = round((time.monotonic() - start_time) * 1000, 2)
            log_entry = {
                "event": "http_request_error",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else "unknown",
                "error": str(exc),
            }
            logger.error(json.dumps(log_entry))
            raise exc

        duration_ms = round((time.monotonic() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id

        # Skip noisy polling endpoints from verbose access logging
        if request.url.path not in ("/health", "/favicon.ico"):
            log_entry = {
                "event": "http_request",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "client_ip": request.client.host if request.client else "unknown",
            }
            logger.info(json.dumps(log_entry))

        return response
