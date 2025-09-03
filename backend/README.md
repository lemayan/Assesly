# Backend (Express + Prisma + SQLite)

## Prerequisites
- Node.js 18+

## Setup
1. Ensure `.env` exists (the repo includes one pointing to SQLite: `DATABASE_URL="file:./dev.db"`).
2. Install dependencies: `npm install`
3. Create database schema: `npm run prisma -- db push`
4. Seed sample data: `npm run seed`

## Scripts
- `npm run dev` Start API with nodemon (TS)
- `npm run build` Compile TypeScript
- `npm run start` Run compiled JS
- `npm run prisma -- db push` Create/update DB schema (SQLite)
- `npm run seed` Seed database

## API URLs
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/exams` (auth)
- `POST /api/exams` (admin)
- `GET /api/exams/:id` (auth)
- `PUT /api/exams/:id` (admin)
- `DELETE /api/exams/:id` (admin)
- `POST /api/questions` (admin)
- `POST /api/questions/import` (admin, file=csv)
- `GET /api/questions` (admin)
- `POST /api/results/submit` (auth)
- `GET /api/results/mine` (auth)
- `GET /api/results/:id/detail` (auth)
- `GET /api/results/analytics/overview` (auth)

Auth with `Authorization: Bearer <token>` from login response.
