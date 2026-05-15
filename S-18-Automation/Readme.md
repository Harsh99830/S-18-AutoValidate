# S18 Automation Portal — Poornima University

A full-stack web application that digitizes the S18 form process at Poornima University. Students can submit participation requests for hackathons, competitions, and events online — and get bonus attendance approved through a multi-level digital workflow without any physical paperwork.

---

## What is S18?

S18 is Poornima University's official form for claiming bonus attendance when a student participates in external activities like hackathons, technical competitions, workshops, or cultural events. Traditionally this was a physical form passed through multiple offices. This portal automates the entire process digitally.

---

## Features

- Google OAuth login restricted to `@poornima.edu.in` accounts
- Role-based access for Students, Tutors, HODs, and Chief Proctor
- Students submit S18 forms with activity details, team members, and document links
- Three-level approval chain: Tutor → HOD → Chief Proctor
- Each approver can approve or reject with remarks
- Chief Proctor grants final bonus attendance days
- JWT-based authentication with 7-day session
- Glassmorphism UI with Poornima University branding

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool + dev server |
| React Router DOM | 7 | Client-side routing |
| Tailwind CSS | 4 | Styling |
| Axios | 1.x | HTTP requests |
| Lucide React | 1.x | Icons |
| React Hot Toast | 2.x | Notifications |

### Backend
| Package | Version | Purpose |
|---|---|---|
| Express | 5 | Web server |
| Mongoose | 9 | MongoDB ODM |
| Passport.js | 0.7 | Google OAuth strategy |
| passport-google-oauth20 | 2 | Google OAuth 2.0 |
| jsonwebtoken | 9 | JWT auth |
| bcryptjs | 3 | Password hashing |
| nodemailer | 8 | Email (future use) |
| dotenv | 16 | Env config |
| cors | 2 | Cross-origin requests |
| nodemon | 3 | Dev auto-restart |

### Database
- MongoDB Atlas (cloud-hosted)

---

## Project Structure

```
S18-Automation/
├── Frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx              # Google OAuth login page
│   │   │   ├── AuthCallback.jsx       # OAuth redirect handler
│   │   │   ├── StudentDashboard.jsx   # Student view
│   │   │   ├── TutorDashboard.jsx     # Tutor approval view
│   │   │   ├── HODDashboard.jsx       # HOD approval view
│   │   │   └── ProctorDashboard.jsx   # Chief Proctor view
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx     # Role-based route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Global auth state
│   │   ├── utils/
│   │   │   └── api.js                 # Axios instance
│   │   ├── App.jsx                    # Routes
│   │   └── main.jsx                   # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── .env
│
└── Backend/
    ├── src/
    │   ├── config/
    │   │   ├── db.js                  # MongoDB connection
    │   │   └── passport.js            # Google OAuth strategy
    │   ├── controllers/
    │   │   ├── authController.js      # Login, callback, getMe
    │   │   └── s18Controller.js       # Form CRUD + approvals
    │   ├── middleware/
    │   │   └── authMiddleware.js      # protect + authorizeRoles
    │   ├── models/
    │   │   ├── User.js                # User schema (all roles)
    │   │   └── S18.js                 # S18 form schema
    │   └── routes/
    │       ├── authRoutes.js          # /api/auth/*
    │       └── s18Routes.js           # /api/s18/*
    ├── server.js                      # App entry point
    └── .env
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Cloud Console project with OAuth 2.0 credentials

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd S18-Automation
```

### 2. Backend setup

```bash
cd Backend
npm install
```

Create `.env` in `Backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd Frontend
npm install
```

Create `.env` in `Frontend/`:

```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`, Backend on `http://localhost:5000`.

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API** and **Google OAuth 2.0**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   - Development: `http://localhost:5000/api/auth/google/callback`
   - Production: `https://your-backend-domain.com/api/auth/google/callback`
7. Copy Client ID and Secret into your Backend `.env`

---

## API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/google` | Initiate Google OAuth flow |
| GET | `/google/callback` | Google OAuth callback |
| GET | `/me` | Get current user (protected) |

### S18 Routes — `/api/s18`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/` | student | Submit new S18 form |
| GET | `/my` | student | Get my submitted forms |
| GET | `/pending/tutor` | tutor | Get forms pending tutor review |
| PUT | `/:id/tutor` | tutor | Approve or reject as tutor |
| GET | `/pending/hod` | hod | Get forms pending HOD review |
| PUT | `/:id/hod` | hod | Approve or reject as HOD |
| GET | `/pending/proctor` | chief_proctor | Get forms pending proctor review |
| PUT | `/:id/proctor` | chief_proctor | Final approval + grant bonus days |
| GET | `/:id` | any | Get single form by ID |

---

## Approval Flow

```
Student submits form
        ↓
   Tutor reviews → approve / reject
        ↓
   HOD reviews   → approve / reject
        ↓
 Chief Proctor   → approve + set bonus attendance days
        ↓
  Student gets bonus attendance credited
```

Form status values: `pending` → `tutor_approved` → `hod_approved` → `approved` / `rejected`

---

## User Roles

| Role | Value in DB | Access |
|---|---|---|
| Student | `student` | Submit forms, view own status |
| Tutor | `tutor` | First-level approval |
| HOD | `hod` | Second-level approval |
| Chief Proctor | `chief_proctor` | Final approval + bonus grant |

> Roles are assigned manually in MongoDB. New Google logins default to `student`.

---

## Deployment

### Backend (e.g. Render / Railway)

Update `.env`:
```env
CLIENT_URL=https://your-frontend-domain.com
GOOGLE_CALLBACK_URL=https://your-backend-domain.com/api/auth/google/callback
```

### Frontend (e.g. Vercel / Netlify)

Update `.env`:
```env
VITE_API_URL=https://your-backend-domain.com
```

Also update Google Cloud Console → Authorized redirect URIs to include your production backend callback URL.

---

## Known Notes

- Domain restriction (`@poornima.edu.in` only) is currently commented out in `passport.js` for testing. Uncomment before production:
  ```js
  if (!email.endsWith('@poornima.edu.in')) {
    return done(null, false, { message: 'invalid_domain' });
  }
  ```
- Role assignment is manual via MongoDB — no admin panel yet
- `nodemailer` is installed but email notifications are not wired up yet

---

## License

MIT — Poornima University Internal Project · 2025
