# CareerPilot AI - Server

This folder contains the Express.js backend for CareerPilot AI.

## Highlights
- Production-ready Mongoose models for users, student profiles, resumes, companies, assessment questions, mock interviews, resume analyses, skill-gap reports, placement predictions, progress, notifications, and admin logs
- Relationship-aware schemas with indexes, validation, and timestamps
- Reusable CRUD service layer with pagination, filtering, searching, sorting, and student/admin authorization rules
- JWT authentication with access and refresh tokens
- Password reset flow with email delivery support
- Security hardening via Helmet, CORS, rate limiting, request sanitization, and XSS protection
- Validation using Zod and regression tests via Jest + Supertest

## Run locally

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

## Environment variables
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `AI_SERVICE_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## API examples
- `GET /health` - health check
- `POST /api/auth/register` - register a user
- `POST /api/auth/login` - login and receive a token and refresh token
- `POST /api/auth/refresh` - exchange a refresh token for a new access token
- `POST /api/auth/forgot-password` - issue a reset token
- `POST /api/ai/*` - proxied AI endpoints

## Testing

```bash
npm test
```
