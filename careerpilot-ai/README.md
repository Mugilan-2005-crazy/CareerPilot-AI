# CareerPilot AI

Professional project scaffold for the CareerPilot AI platform.

## Structure Overview

- client/: React + Tailwind CSS frontend
- server/: Node.js + Express.js backend
- ai/: Python + FastAPI AI services
- database/: MongoDB schemas, scripts, and seed-related assets
- docs/: Architecture, planning, and product documentation

## Notes

This initial scaffold contains only the folder structure and documentation placeholders. No implementation code has been added yet.

## Backend and Database

The `server/` folder now contains a production-ready Express backend with Mongoose models, JWT authentication (access + refresh tokens), password reset flow, and CRUD APIs for core collections. See `server/README.md` for details.
