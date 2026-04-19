# Examiq

A modern online examination platform built for educational institutions and professional assessment workflows. Examiq supports role-based access for Admins, Examiners, and Students, with features ranging from AI-powered question generation to real-time leaderboards and certificate issuance.

## Features

### Student
- Take timed MCQ, True/False, and Subjective exams
- Practice mode with instant answer feedback
- View detailed post-exam question analysis
- Performance analytics dashboard with score trends and pass rate chart
- Leaderboard access per exam
- Certificate generation for high-scoring results

### Admin and Examiner
- Create and manage courses
- Deploy exams with scheduling (start/end time), duration, and mark configuration
- Randomize question order per attempt
- Bulk import questions via JSON file
- Generate exam questions using AI (powered by Groq)
- Manage exam lifecycle: Draft, Published, Active, Closed
- Manual grading console for subjective answers

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite
- Vanilla CSS with glassmorphism design
- Deployed on Vercel

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JSON Web Tokens for authentication
- Groq API (OpenAI-compatible SDK) for AI question generation
- Deployed on Vercel (serverless functions)

## Project Structure

```
Examiq/
├── frontend/               # Vite + React frontend
│   ├── src/
│   │   ├── App.tsx         # Main app with auth and dashboard
│   │   ├── AdminPanel.tsx  # Admin/Examiner tools
│   │   ├── TakeExam.tsx    # Exam engine
│   │   └── types.ts        # Shared TypeScript types
│   └── vercel.json         # SPA routing config
│
└── backend/                # Express API
    ├── api/
│   │   └── index.ts        # Vercel serverless entry point
    └── src/
        ├── controllers/    # Route handlers
        ├── models/         # Mongoose schemas
        ├── routes/         # Express routers
        ├── middleware/      # Auth middleware
        └── index.ts        # App bootstrap
```

## Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account (or local MongoDB)
- Groq API key (free at https://console.groq.com)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_groq_api_key
PORT=4000
```

Start the dev server:

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```
VITE_API_URL=http://localhost:4000
```

Start the dev server:

```bash
npm run dev
```

## Deployment on Vercel

This project is deployed as two separate Vercel projects from the same GitHub repository.

### Backend Deployment

1. Create a new Vercel project, set the Root Directory to `backend`
2. Add the following environment variables in the Vercel dashboard:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `GROQ_API_KEY`
3. Deploy. Copy the assigned domain (e.g. `https://examiq-api.vercel.app`)

### Frontend Deployment

1. Create a second Vercel project, set the Root Directory to `frontend`
2. Add the following environment variable:
   - `VITE_API_URL` = your backend domain without a trailing slash (e.g. `https://examiq-api.vercel.app`)
3. Deploy

## Environment Variables Reference

| Variable | Location | Description |
|---|---|---|
| `MONGO_URI` | Backend | MongoDB Atlas connection string |
| `JWT_SECRET` | Backend | Secret used to sign JWT tokens |
| `GROQ_API_KEY` | Backend | API key for Groq AI question generation |
| `VITE_API_URL` | Frontend | Base URL of the deployed backend API |

## Roles

| Role | Permissions |
|---|---|
| Admin | Full access: create courses, exams, grade submissions, manage lifecycle |
| Examiner | Create and manage exams, grade subjective answers |
| Student | Take available exams, view results and leaderboards |

## License

This project is open source and available under the MIT License.
