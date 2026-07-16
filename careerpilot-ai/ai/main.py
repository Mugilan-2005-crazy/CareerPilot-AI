from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analysis

app = FastAPI(
    title="CareerPilot AI Service",
    description="AI microservice for resume analysis, skill gaps, placement prediction, company recommendations, and interview questions",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router, prefix="/api/ai", tags=["AI"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "careerpilot-ai"}
