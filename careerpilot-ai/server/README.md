# CareerPilot AI - Server

This folder contains the Express.js backend for CareerPilot AI.

Key features:
- MongoDB via Mongoose models for Users, Profiles, Companies, Questions, Reports
- JWT Authentication with access + refresh tokens
- Password reset flow (token stored on user)
- Role-based authorization middleware
- Generic CRUD controllers for common collections

Run locally:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Environment variables (in `.env`):
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `AI_SERVICE_URL`

API (examples):
- `POST /api/auth/register` - register user
- `POST /api/auth/login` - login user (returns `token` and `refreshToken`)
- `POST /api/auth/refresh` - exchange refresh token for new access token
- `POST /api/ai/*` - proxied AI endpoints
