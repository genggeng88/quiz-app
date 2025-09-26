Here’s a polished, copy-pasteable `README.md` you can drop into your repo. I kept it tight, clear, and deployment-ready, with spots for your screenshots.

---

# Quiz App

A full-stack web application for taking quizzes by category with an admin console for managing users, questions, quizzes, and contact messages.

* **Frontend:** TypeScript (Vite + React)
* **Backend:** Python 3.10, FastAPI, SQLAlchemy
* **Database:** PostgreSQL 17
* **Auth:** JWT (header-based), role-based access (user/admin)
* **Hosting:** Render (Web Service + Static Site + PostgreSQL)

**Live Demo**

* UI: [https://quiz-app-ui-ngo8.onrender.com](https://quiz-app-ui-ngo8.onrender.com)
* API: [https://quiz-app-v1md.onrender.com](https://quiz-app-v1md.onrender.com)

---

## Table of contents

* [Features](#features)
* [User Flows](#user-flows)
* [Screenshots](#screenshots)
* [Architecture](#architecture)
* [API Overview](#api-overview)
* [Quick Start (Local Dev)](#quick-start-local-dev)
* [Environment Variables](#environment-variables)
* [Database](#database)
* [Deployment (Render)](#deployment-render)
* [Security Notes](#security-notes)
* [Troubleshooting](#troubleshooting)
* [Roadmap](#roadmap)
* [License](#license)

---

## Features

**General User**

* Register, log in/out
* Browse categories and take quizzes
* See quiz history, average correct rate, and per-quiz details
* Send contact messages to admins

**Admin**

* Review & manage users (activate/deactivate)
* Review & filter quizzes (by category/user)
* Manage questions (add/edit/activate/deactivate)
* Review user contact messages

---

## User Flows

### General User

1. **Register an account**
2. **Take a quiz** (choose category → answer questions → submit)
3. **Review history** (list of attempts, average correct rate)
4. **View quiz details** (per-question result breakdown)
5. **Send contact message** (report issues)

### Admin

1. **Log in** (admin role)
2. **User management** (activate/deactivate)
3. **Quiz management** (filter by category/user)
4. **Question management** (add/edit/toggle active)
5. **Contact messages** (review/respond offline)

---

## Screenshots

> Add your images to `docs/screenshots/` and link them here.

* **Register & Login**
  ![Register](docs/screenshots/register.png)
  ![Login](docs/screenshots/login.png)

* **Take a Quiz**
  ![Quiz](docs/screenshots/quiz.png)

* **History & Details**
  ![History](docs/screenshots/history.png)
  ![Quiz Detail](docs/screenshots/quiz-detail.png)

* **Admin Console**
  ![Users](docs/screenshots/admin-users.png)
  ![Questions](docs/screenshots/admin-questions.png)
  ![Quizzes](docs/screenshots/admin-quizzes.png)
  ![Contacts](docs/screenshots/admin-contacts.png)

---

## Architecture

```
[ React (Vite, TS) ]  ──>  [ FastAPI ]  ──>  [ PostgreSQL 17 ]
         JWT (Authorization: Bearer <token>)    SQLAlchemy
```

* SPA calls the API with a **Bearer JWT** in the `Authorization` header.
* Admin vs. user gates are enforced server-side and in the router guards client-side.
* CORS allows the UI origin(s) to call the API.

---

## API Overview

> Exact schemas live in the code; this is the shape you can expect.

**Auth**

* `POST /auth/register` → `{ ok, user }`
* `POST /auth/login` → `{ ok, token, user }`
* `POST /auth/logout` → `{ ok }`
* `GET /auth/me` (auth) → `{ ok, user }`

**Categories**

* `GET /categories` → `{ ok, data: Category[] }`

**Quizzes**

* `POST /quizzes` (auth) → start/submit quiz
* `GET /quizzes/history?userId=&categoryId=` (auth)
* `GET /quizzes/{quizId}` (auth) → quiz detail

**Questions (admin)**

* `GET /admin/questions`
* `POST /admin/questions` (add)
* `PATCH /admin/questions/{id}` (edit/activate/deactivate)

**Users (admin)**

* `GET /admin/users`
* `PATCH /admin/users/{id}/status` (`active`|`suspended`)

**Contacts**

* `POST /contact` (user submit)
* `GET /admin/contacts` (admin review)

Auth header for protected endpoints:

```
Authorization: Bearer <JWT>
```

---

## Quick Start (Local Dev)

### Prerequisites

* Node 18+ (Node 20 recommended), pnpm/yarn/npm
* Python 3.10
* PostgreSQL 14+ (17 recommended)

### 1) Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Set env (see .env.example)
export DATABASE_URL="postgresql+psycopg://quiz:quiz@localhost:5432/quizdb"
export JWT_SECRET="change-me"
export JWT_ALGORITHM="HS256"
export JWT_EXPIRE_DAYS=7

# Initialize DB (if you don’t use Alembic yet)
psql -h localhost -U quiz -d quizdb -f quiz_app_schema.sql

# Run API
uvicorn app.main:app --reload
```

### 2) Frontend

```bash
cd frontend
pnpm install        # or yarn / npm i
# .env
echo 'VITE_API_BASE_URL=http://localhost:8000' > .env.local
pnpm dev            # or yarn dev / npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

**Frontend**

```
VITE_API_BASE_URL=https://quiz-app-v1md.onrender.com
```

**Backend**

```
DATABASE_URL=postgresql+psycopg://<user>:<pass>@<host>:5432/<db>
JWT_SECRET=change-me
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7

# Optional admin bootstrap
ALLOW_ADMIN_SELF_REGISTER=false
ADMIN_BOOTSTRAP_SECRET=please-override

# Optional cookie fallback (default: header-JWT only)
USE_COOKIE_AUTH=false
COOKIE_NAME=token
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
COOKIE_MAX_AGE=604800
```

---

## Database

**Core tables** (names may vary; align to your schema):

* `users(user_id, email, password_hash, is_admin, is_active, firstname, lastname, created_at)`
* `category(category_id, name, is_active)`
* `questions(id, category_id, prompt, is_active, ...)`
* `choice(id, question_id, text, is_answer)`
* `quizzes(quiz_id, user_id, category_id, started_at, finished_at, score, correct_rate)`
* `quizquestion(quiz_id, question_id, answer_choice_id, correct)`

If you haven’t set up Alembic yet, apply `quiz_app_schema.sql` manually (as shown in Quick Start).

---

## Deployment (Render)

**Render services**

* **Web Service** → FastAPI (`gunicorn`/`uvicorn`)
* **Static Site** → Frontend build
* **PostgreSQL** → Managed DB

**API**

* Build: `pip install -r backend/requirements.txt`
* Start: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
* Env: set the **DATABASE\_URL** Render provides, **JWT\_SECRET**, CORS **allow\_origins** to your UI domain.

**UI**

* Build command: `pnpm i && pnpm build`
* Publish directory: `frontend/dist`
* `VITE_API_BASE_URL` → point to your API URL

---

## Security Notes

* Store JWT **only** in memory or localStorage (you’re using header-based JWT). If you switch to cookies, add CSRF protection.
* Do not accept `is_admin` from clients unless guarded by a server-side bootstrap secret.
* Hash passwords with `passlib[bcrypt]` (installed) and verify on login.
* Lock CORS to exact UI origins; include `Authorization` in allowed headers.

---

## Troubleshooting

* **CORS / Preflight 405**
  Ensure CORS middleware is registered and includes:

  * `allow_origins=["https://<your-ui>", "http://localhost:5173"]`
  * `allow_headers=["Authorization","Content-Type"]`
  * `allow_methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"]`

* **401 after refactor**

  * Token not stored/attached: confirm `Authorization: Bearer <token>` is sent.
  * Secret/algorithm changed: log in again to get a fresh token.

* **passlib/bcrypt error (`__about__`)**
  Pin compatible versions: `passlib[bcrypt]>=1.7.4,<1.8` and `bcrypt>=4,<5`.

* **Logs not showing**
  Set root logger/handler on startup and run `uvicorn ... --log-level info`.

---

## Roadmap

* Alembic migrations
* Quiz timer & anti-cheat UX
* Per-question explanations and hints
* Export quiz results (CSV)
* Admin audit log

---

## License

Copyright (c) 2025 Qin Geng. All rights reserved.

This repository is provided for viewing purposes only. No permission is
granted to use, copy, modify, or distribute the code or its contents
without prior written consent from the copyright holder.

---
