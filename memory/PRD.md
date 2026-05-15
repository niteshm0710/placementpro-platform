# PlacementPro AI - Product Requirements Document

## Original Problem Statement
Fix and complete the PlacementPro AI project. Implement 3 fully-functional roles (Student, HOD, TPO) with role-based JWT auth, demo AI responses (no real Gemini/OpenAI), MongoDB persistence, professional UI without emojis, and no "Made with Emergent" branding.

## Architecture
- **Backend**: FastAPI (single file `/app/backend/server.py`), Motor + MongoDB, PyJWT + bcrypt auth, deterministic hash-based "demo AI" logic
- **Frontend**: React 19 + React Router 7, Tailwind + shadcn UI, Recharts, IBM Plex Sans / Bricolage Grotesque (Swiss / high-contrast)
- **Auth**: JWT in localStorage as `pp_token`; role-based routing & protected routes
- **DB collections**: users, resumes, drives, applications, interview_sessions, notifications

## User Personas
1. **Student** - Final/pre-final year undergrad preparing for campus placements.
2. **HOD** - Head of a department monitoring placement performance of their branch.
3. **TPO** - Training & Placement Officer managing the institute placement cell.

## Core Requirements (static)
### Authentication
- Role-aware signup (Student / HOD / TPO) and login with JWT.
- Protected routes per role.

### Student
- Resume upload + AI Resume Analyzer (ATS score, quality score, skills, strengths, weaknesses, suggestions)
- Skill Gap Analyzer (matched, missing skills, course recommendations with working URLs)
- Placement Prediction (probability, readiness level, improvement areas, factor breakdown)
- Mock Interview (questions per difficulty/role + scored feedback + history)
- Job Drives listing with one-click apply
- Application tracking with status pipeline
- Course recommendations (catalog + personalized)
- Notifications (role + user targeted)
- Profile settings (skills, CGPA, bio, phone, etc.)

### HOD
- Department analytics dashboard (counts, status mix, company pie chart, top performers)
- Student performance tracker (apps, selections, skills, CGPA)
- Resume Review (per-student resume + analysis in dialog)
- Skill Gap Overview (aggregate top skills + missing skills bar charts)
- Reports (CSV download, placement rate, company breakdown)
- Notifications feed

### TPO
- Institute-wide dashboard (cross-department analytics, company chart, status pie, avg package)
- Drive management (CRUD with create/edit dialog)
- Applications (filter by status, dropdown to update status -> auto-notifies student)
- Students directory with search
- Reports (CSV download by dept and company)
- Broadcast notifications (to role / everyone)

## Implementation Status (Jan 2026)
- [x] JWT auth (signup/login/me, bcrypt hashing)
- [x] Seed: 5 students + 1 HOD + 1 TPO + 6 drives + sample applications + notifications
- [x] All Student endpoints + UI (10 pages)
- [x] All HOD endpoints + UI (5 pages)
- [x] All TPO endpoints + UI (6 pages)
- [x] Demo AI: Resume Analyzer, Skill Gap, Placement Prediction, Mock Interview - deterministic & feature-rich
- [x] Course catalog with 30+ working URLs
- [x] Removed "Made with Emergent" branding & favicon set
- [x] Recharts dashboards (bar/pie/radial gauges)
- [x] Swiss / high-contrast design (Bricolage Grotesque + IBM Plex Sans)
- [x] data-testid coverage across interactive elements
- [x] Backend testing: 48/48 pytest tests passing (100%)

## Prioritized Backlog
### P0 (next)
- Frontend automated regression (Playwright)

### P1
- Validate `drive_date` as ISO date in Pydantic
- Migrate to FastAPI lifespan handlers (silence DeprecationWarnings)
- Email/SMS notifications (Resend/Twilio integration)

### P2
- PDF parsing for resume upload (currently text only)
- Mobile-first responsive polish for tables
- Role-based admin: HOD broadcast to own department only

## Test Credentials
See `/app/memory/test_credentials.md`
- student@demo.com / password123
- hod@demo.com / password123
- tpo@demo.com / password123
