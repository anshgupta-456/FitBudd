# FitBudd

A training companion for people who work out in Indian cities. Plan your week and log what you did, track
weight and measurements, check your squat or push-up form with your phone camera, book studio classes,
courts and home trainers, work out daily calorie and protein targets, and find people nearby to train with.

The frontend is Next.js 15 (App Router, TypeScript, Tailwind). The backend is a Flask JSON API with
SQLAlchemy and token auth. Sample gyms, studios, trainers and members are seeded for Bengaluru, Mumbai and Delhi.

## Features

| Area | What it does |
| --- | --- |
| Today | This week's sessions, minutes trained, streak, weight trend, the next seven days, partner activity |
| Schedule | Week-by-week plan; log sessions with effort and notes; training log |
| Progress | Weight, waist, body fat and resting heart rate over time |
| Nutrition | Mifflin–St Jeor based calorie and macro targets, a day of Indian meals to hit them, cycle-phase notes, coach-written plans |
| Form check | Pose detection in the browser (MediaPipe). Counts squats, push-ups and curls and flags depth, hip sag, torso lean and elbow drift. Video never leaves the device |
| Machine guide | Set-up, steps, cues and common mistakes for six common machines |
| Classes & courts | Studio timetable for the next 7 days with live spots left; hourly court slots; cancel from My bookings |
| Gyms | Filter by city, price, amenities and women-only hours |
| Trainers | Home-session trainers by city and specialty; booking with travel-time clash checks |
| Partners | Ranked suggestions (city, level, goals, time of day), requests, connections |
| Messages | Direct messages between connected partners |

## Run it locally

You need Node 18.18+ and Python 3.10+.

**Windows**

```powershell
.\start-all.ps1
```

**macOS / Linux**

```bash
./start-all.sh
```

Both scripts create `backend/.venv`, install dependencies on first run, and start the API on
http://localhost:5001 and the web app on http://localhost:3000.

To run the halves yourself:

```bash
# API
cd backend
python -m venv .venv
.venv/Scripts/activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
python run.py

# Web (second terminal, repo root)
npm install
npm run dev
```

The first API start creates `backend/instance/fitbudd.db` and fills it with sample data, including a demo
account with a few weeks of history. Its login is `DEMO_EMAIL` / `DEMO_PASSWORD` in
[backend/fitbudd/seed.py](backend/fitbudd/seed.py). To start again from scratch:

```bash
cd backend
flask --app run reset-db
```

## Tests and checks

```bash
cd backend && pytest          # API: auth, ownership, bookings, partners, messages, nutrition maths
npm run typecheck             # web
npm run build                 # web production build
```

CI runs all three on every push and pull request ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Project layout

```
app/
  (auth)/          sign-in and sign-up
  (app)/           signed-in pages: today, workouts, progress, nutrition, form-check, machines,
                   classes, gyms, trainers, partners, messages, profile
components/        app shell, workout dialog, UI primitives (components/ui)
lib/               API client, auth context, types, formatting, pose maths (lib/pose.ts)
backend/
  fitbudd/
    __init__.py    app factory
    models.py      SQLAlchemy models
    auth.py        password hashing, tokens, @login_required
    routes/        one blueprint per area
    nutrition.py   calorie and macro calculation
    timetable.py   recurring class and court timetable
    seed.py        sample data and the demo account
  tests/
```

## API

All routes are under `/api` and return JSON. Errors look like
`{"error": {"code": "invalid", "message": "...", "fields": {"date": "Use the format YYYY-MM-DD"}}}`.
Everything except sign-up, sign-in, gyms and the health check needs `Authorization: Bearer <token>`, and
every member-owned record is looked up through the signed-in member, never an id from the request.

| Method | Path | |
| --- | --- | --- |
| POST | `/auth/register`, `/auth/login` | returns `{token, user}` |
| GET | `/auth/me` | current member |
| PATCH / DELETE | `/profile` | update profile / delete account (needs password) |
| POST | `/profile/password` | change password |
| GET / POST | `/workouts` | list (`from`, `to`, `status`) / create |
| PATCH / DELETE | `/workouts/:id` | edit, log, skip / delete |
| GET | `/workouts/summary?today=` | week totals, streak, 8-week load |
| GET / POST | `/measurements` | list / save (one entry per day) |
| GET | `/gyms`, `/gyms/:id` | filters: `city`, `q`, `max_price`, `amenity`, `women_only_hours`, `sort` |
| GET | `/classes`, `/courts` | `city`, `date`, `category` / `sport` |
| POST / DELETE | `/classes/:id/booking`, `/courts/:id/booking` | book / cancel |
| GET | `/bookings` | upcoming classes, courts and trainer sessions |
| GET | `/trainers` | `city`, `specialty`, `women_focus`, `sort` |
| POST | `/trainers/:id/sessions` | book a home session |
| GET / POST | `/sessions`, `/sessions/:id/cancel` | your sessions / cancel |
| GET | `/diet-plans` | `goal`, `diet`, `for_women` |
| POST | `/nutrition/targets` | calorie and macro targets (falls back to profile values) |
| GET | `/partners/suggestions`, `/partners`, `/partners/requests` | |
| POST | `/partners/requests` | send (`user_id`, `note`) |
| POST | `/partners/requests/:id/accept`, `/decline` | |
| DELETE | `/partners/requests/:id`, `/partners/:userId` | withdraw / remove |
| GET | `/conversations`, `/messages/:userId`, `/inbox/counts` | |
| POST | `/messages/:userId` | send |

## Deploying

The repo is set up for **Vercel** (web) and **Render** (API).

- **Render**: create a Blueprint from `render.yaml`. It generates `SECRET_KEY`; set `FRONTEND_URL` to your
  Vercel URL so CORS allows it.
- **Vercel**: import the repo and set `NEXT_PUBLIC_API_BASE` to the Render URL.

On Render's free plan the disk is wiped on every deploy and restart, so the SQLite database resets to the
sample data, and the API sleeps after 15 minutes idle (the first request then takes up to a minute; the web
app shows a retry screen meanwhile). For data that persists, point `DATABASE_URL` at a Postgres database and
add `psycopg[binary]` to `backend/requirements.txt`.

## Sample data

Gyms, studios, trainers and other members are made up for the demo. Prices are in rupees and plausible for
each city, but none of the listings are real businesses. Sample members can receive messages but don't reply.
