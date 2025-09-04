# Assessly / Examina

An exam and results platform built with:
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Node.js (Express) + Prisma ORM
- Database: SQLite (file-based, no install needed)

This guide is beginner‑friendly and focuses on Windows with PowerShell.

## What you need
- Windows 10/11
- Node.js LTS (18 or 20). Download from nodejs.org and install.
- Git (optional, for cloning). Download from git-scm.com

## Get the project
Option A — Zip file
- Unzip the project to a folder like `C:\Assessly`.

Option B — Git clone
- Open PowerShell and run:
   - git clone https://github.com/lemayan/Assesly.git
   - cd Assesly

## First-time setup (5–8 minutes)

Do these steps once to set up the API and database.

## NB Before the installation process create a .env file in your backend i.e right click on backend, create new file , name it .env then paste this 
DATABASE_URL="file:./prisma/dev.db"


1) Backend (API)
- In PowerShell:
   - cd backend
   - npm install
   - npm run prisma -- db push   (creates the SQLite database)
   - npm run seed                (adds admin and sample data)

2) Frontend (Web App)
- In a new PowerShell window:
   - cd frontend
   - npm install

That’s it for setup. The database file lives at `backend/prisma/dev.db`.

## How to run (every time)

1) Start the backend API
- In PowerShell:
   - cd backend
   - npm run dev
- The API listens on http://localhost:4000/api

2) Start the frontend
- In another PowerShell window:
   - cd frontend
   - npm run dev
- Open the URL it prints (usually http://localhost:5173)

## Log in
- Admin: admin@examina.local / password123
- Student: student@examina.local / password123

## Project structure
- frontend/  React app (Vite) with Tailwind
- backend/   Express API with Prisma (SQLite)

## Troubleshooting
- Can’t log in / shows “Network Error”
   - Make sure the backend is running (window where you ran `npm run start` should say “API listening on …:4000”).
   - If port 4000 is busy, stop other apps or set a custom port: set the env variable `PORT=4001` before launching the backend and then update the frontend API URL.
- Blank page or “API offline” on login
   - Frontend expects the API at http://localhost:4000/api. If you changed the port, set `VITE_API_URL` in `frontend/.env.local` accordingly.
- Reset to clean sample data
   - Stop the backend. Delete the file `backend/prisma/dev.db`. Then run from `backend`: `npm run prisma -- db push` and `npm run seed`.

## Production build (optional)
- Backend (compile TS):
   - cd backend
   - npm run build
   - npm run start
- Frontend (build static files):
   - cd frontend
   - npm run build
   - Use a static server (or keep running `npm run dev` for testing).

For more details, see `backend/README.md` and `frontend/README.md`.
