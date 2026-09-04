from fastapi import FastAPI
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.routers import analysis

app = FastAPI(
    title="CareerPilot AI Service",
    description="AI microservice for resume analysis, skill gaps, placement prediction, company recommendations, and interview questions",
    version="1.0.0",
)

# Reject oversized request bodies before any body parsing work happens.
MAX_BODY_BYTES = 64 * 1024  # 64 KB; largest valid payload is ~50 KB resume text.


@app.middleware("http")
async def reject_oversized_bodies(request: Request, call_next):
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body too large."},
        )
    return await call_next(request)


# NOTE: No CORS middleware is configured. This service is an INTERNAL
# backend that is only ever called server-to-server by the Node API gateway
# (via nginx/docker-network). It is never exposed directly to a browser, so
# enabling permissive CORS would only widen the attack surface for cross-site
# abuse of the AI endpoints. Keep this internal.

app.include_router(analysis.router, prefix="/api/ai", tags=["AI"])


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "careerpilot-ai"}
