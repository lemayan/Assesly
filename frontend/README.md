# Examina Frontend (React + Tailwind + Vite)

## Setup
1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`

The app expects the backend API at `http://localhost:4000/api`.
To override, create `frontend/.env.local` with:
```
VITE_API_URL=http://localhost:4000/api
```

## Pages
- Login
- Dashboard (Take Exam, Review Results, Analytics, Admin for admin role)
- Exam taking page with timer, progress, flagging, and auto-save
- Results list
- Analytics with Recharts
