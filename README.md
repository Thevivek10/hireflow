# HireFlow — AI-Powered Job Application Pipeline

## ✨ Key Features

### For Employers
- **Post & manage jobs** with full CRUD
- **AI Auto-Shortlisting**: Every applicant's CV is automatically scored (0-100) and ranked by AI the moment they apply
- **View applicants ranked by AI score** — highest compatibility shown first
- **Update application status** (shortlisted, reviewed, hired, rejected)
- **Delete unsuitable applicants**
- **Analytics dashboard** with charts (status distribution, category breakdown, applications over time)
- **AI career insights** generated automatically

### For Job Seekers
- **Browse & search jobs** with filter/sort
- **AI CV Builder**: Generate a tailored, ATS-optimized CV for any job in 30 seconds
- **Upload existing CV** (PDF/DOC/TXT) — AI scores it instantly
- **Track all applications** with AI scores and rankings
- **Personal analytics** with AI insights

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| AI | Gemini 3 pro |
| Auth | JWT |
| File Upload | Multer |
| PDF Parsing | pdf-parse |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Anthropic API key

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb://localhost:27017/jobtracker
JWT_SECRET=your_super_secret_key
ANTHROPIC_API_KEY=sk-ant-...your-key...
PORT=5000
```

### 3. Start the servers

**Backend** (port 5000):
```bash
cd backend
npm run dev
```

**Frontend** (port 3000):
```bash
cd frontend
npm start
```

Visit `http://localhost:3000`

---

## 📂 Project Structure

```
job-tracker/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema (employer/applicant)
│   │   ├── Job.js           # Job posting schema
│   │   ├── Application.js   # Application + AI scores
│   │   └── Activity.js      # Audit logs
│   ├── routes/
│   │   ├── auth.js          # JWT auth
│   │   ├── jobs.js          # Job CRUD + applicants
│   │   ├── applications.js  # Apply, delete, status update
│   │   ├── analytics.js     # Dashboard analytics
│   │   └── ai.js            # CV generation + insights
│   ├── middleware/
│   │   └── auth.js          # JWT verification
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── Login.jsx / Register.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Jobs.jsx
│       │   ├── JobDetail.jsx
│       │   ├── CreateJob.jsx / EditJob.jsx
│       │   ├── ApplyJob.jsx      # AI CV Builder + upload
│       │   ├── Applicants.jsx    # AI-ranked applicants view
│       │   ├── MyApplications.jsx
│       │   └── Analytics.jsx
│       ├── components/
│       │   └── Navbar.jsx
│       └── context/
│           └── AuthContext.jsx
```

---

## 🤖 How AI Shortlisting Works

1. Employer posts a job with a description and requirements
2. Applicant submits CV (uploaded PDF or AI-generated)
3. **Immediately on submission**, the backend sends the CV text + job requirements to Gemini API
4. Gemini scores the candidate 0-100 and writes an analysis
5. All applicants for that job are **re-ranked** by score
6. Employer sees a ranked list — #1 is the best match

### AI Prompt Logic
```
Given: Job Title, Description, Requirements + Candidate CV
Output: { score: 0-100, analysis: "...", strengths: [...], gaps: [...] }
```

---

## 🔐 API Endpoints

```
POST   /api/auth/register      # Register (employer/applicant)
POST   /api/auth/login         # Login → JWT token
GET    /api/auth/me            # Current user

GET    /api/jobs               # List jobs (search/filter/sort)
GET    /api/jobs/my            # My jobs (employer)
GET    /api/jobs/:id           # Single job
POST   /api/jobs               # Create job (employer)
PUT    /api/jobs/:id           # Update job
DELETE /api/jobs/:id           # Delete job + all applications
GET    /api/jobs/:id/applicants # Applicants ranked by AI score

GET    /api/applications/my    # My applications (applicant)
POST   /api/applications/:jobId # Apply + auto AI score
PUT    /api/applications/:id/status # Update status
DELETE /api/applications/:id   # Remove applicant/withdraw

GET    /api/analytics          # Dashboard analytics
POST   /api/ai/generate-cv     # AI generates tailored CV
POST   /api/ai/insights        # AI career insights
```

---

## 🎨 Design

- Dark theme with purple accent (`#6c63ff`)
- Fonts: **Syne** (headers) + **DM Sans** (body)
- Responsive grid layouts
- Recharts for data visualization
- Score bars with color coding (green=high, red=low)

---

## 🐳 Run with Docker

```bash
cp .env.example .env        # set JWT_SECRET (and GEMINI_API_KEY for AI features)
docker compose up --build
```

- App: http://localhost:3000
- API health check: http://localhost:5000/api/health

The stack runs MongoDB, the Express API and the React app (served by nginx, which proxies `/api` to the backend).

## ✅ Tests and CI

```bash
cd backend
npm install
npm test            # Jest + Supertest, models are mocked so no database is needed
npm run test:ci     # same, with a coverage report
```

GitHub Actions (`.github/workflows/ci.yml`) runs on every push to `main` and every pull request: backend tests with coverage, a frontend production build, and a Docker build of both images.
