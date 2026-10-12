# Wasfati App

Mobile-first web app where Wasfaty customers log in and see their body scan results.
It uses the same accounts as the kiosk (`wasfati-portal`): phone number + password, with an
SMS code to sign up or reset a password. Bilingual (العربية / English), Arabic by default.

## How it fits with the other repos

```
wasfati_app (this repo)
  ├── Supabase Auth + RPCs   same project and flow as wasfati-portal
  ├── Supabase `exams`        lists the logged-in user's scans
  └── health service          each result opens its PDF at /exam/<exam_no>/<lang>
```

Nothing here writes scan data. `health` is still the only writer to `exams`.

## Getting started

Requires Node.js 20+.

```bash
cp .env.example .env   # fill in the Supabase URL and anon key (same values as the portal)
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Sign-up and codes

Sign-up is phone → code → details (name, date of birth, gender, password). Password reset is
phone → code → new password. Only Libyan mobile numbers are accepted, as in the portal.

A verification code can be requested for a number once every 5 minutes, and at most 3 times
an hour (the first code plus 2 resends). The app enforces this in `src/lib/otpLimit.js`, but
that only covers this browser. The database enforces it too, in `request_app_auth_otp`, a
function only this app calls. The kiosk keeps its own limit in `request_auth_otp`.

## Database changes (not applied yet)

`supabase/migrations/` holds three changes. None has been run.

| File | What it does | Before applying |
| --- | --- | --- |
| `…_limit_otp_resends.sql` | Adds `request_app_auth_otp` with the 5-minute / 3-per-hour code limit | The app cannot send codes until this is applied; the kiosk is not affected |
| `…_block_anonymous_data_access.sql` | Stops `exams`, `raw` and `credit_transactions` being read or changed without logging in | Nothing changes for logged-in apps |
| `…_scope_exam_access.sql` | Each user sees only their own results; admins see all; providers see their machines | Decide what providers should see |

Results are matched to a user by phone number (`exams.person_idnumber`), because
`exams.user_id` is not being filled in.

## Project structure

```
src/
  components/   AuthPage (login, sign-up, reset), Results, Header, ui (form pieces)
  lib/          supabase (API calls + session), otpLimit, phone, dob
  locales/      ar.json, en.json
  I18nProvider.jsx / i18n.js   language, direction and the t() helper
  index.css     Tailwind import + brand colours
```

All user-facing text lives in `src/locales/`. Change both files together.

## Docker

```bash
docker build -t wasfati-app \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-key .
docker run -d -p 8080:80 wasfati-app
```

The Supabase values are baked in at build time, so they are passed as build arguments
(`.env` is not copied into the image).
