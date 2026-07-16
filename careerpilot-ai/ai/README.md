# CareerPilot AI Service

This FastAPI service provides AI-assisted features for the CareerPilot AI platform.

## Endpoints

- POST /api/ai/resume-analysis
- POST /api/ai/skill-gap
- POST /api/ai/placement-prediction
- POST /api/ai/company-recommendation
- POST /api/ai/interview-questions
- GET /health

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows use .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
